/**
 * @file server.js
 * @description Server entry point with MongoDB connection and API routes setup.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const xss = require("xss-clean");
const { spawn } = require("child_process");

/**
 * @type {string} The MongoDB URI string for connection.
 */
const mongoURI = /** @type {string} */ (process.env.MONGO_URI);

/**
 * @type {express.Application} Express app instance.
 */
const app = express();

/**
 * @type {number|string} Server port number.
 */
const PORT = process.env.PORT || 3001;

/**
 * @type {boolean} Flag to indicate if HTTPS should be used.
 */
const USE_HTTPS = process.env.USE_HTTPS === "true";

/**
 * @type {string} SSL key file path.
 */
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || "./config/server.key";

/**
 * @type {string} SSL certificate file path.
 */
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || "./config/server.cert";

// Import modules
/** @type {() => Promise<void>} */
const fetchData = require("./canvas-interactions/fetchData.js");
/** @type {() => void} */
const uploadIncidents = require("./incident-interactions/uploadIncidents");

// Middleware to sanitize input and enable security headers
/**
 * @type {express.RequestHandler}
 */
const sanitizeMiddleware = require("./middleware/sanitizeMiddleware");
app.use(xss());
app.use(sanitizeMiddleware);

// Enable CORS for frontend access
app.use(
  cors({
    origin: "http://localhost:3000", // React frontend address
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Middleware for parsing JSON
app.use(express.json());

// Import Routes
/** @type {express.Router} */ const userRoutes = require("./routes/userRoutes");
/** @type {express.Router} */ const schoolRoutes = require("./routes/schoolRoutes");
/** @type {express.Router} */ const bullyRoutes = require("./routes/bullyRoutes");
/** @type {express.Router} */ const alertRoutes = require("./routes/alertRoutes");
/** @type {express.Router} */ const contentRoutes = require("./routes/contentRoutes");
/** @type {express.Router} */ const incidentRoutes = require("./routes/incidentRoutes");
/** @type {express.Router} */ const messageRoutes = require("./routes/messageRoutes");
/** @type {express.Router} */ const postRoutes = require("./routes/postRoutes");
/** @type {express.Router} */ const commentRoutes = require("./routes/commentRoutes");
/** @type {express.Router} */ const imageRoutes = require("./routes/imageRoutes");
/** @type {express.Router} */ const analyticsRoutes = require("./routes/analyticsRoutes");

app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/bully", bullyRoutes);
app.use("/api/alert", alertRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/images", imageRoutes);
app.use("/api/analytics", analyticsRoutes);

/**
 * @function
 * @name HealthCheck
 * @description Basic health check route.
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.get("/", (req, res) => {
  res.status(200).send("BullyBlock API is running...");
});

/**
 * @function trainModel
 * @description Spawns Python subprocesses to run AI-related training steps.
 * @returns {void}
 */
const trainModel = () => {
  /**
   * @type {string[]} List of script filenames to run for training.
   */
  const scripts = [
      "pytorch_model_training.py"
    /*
    "text_cleaning.py",
    "feature_extraction.py",
    "tensorflow_scikit_model_training.py"
    */
  ];

  const aiDir = path.resolve(__dirname, '..', 'ai_algorithms'); // Correct base directory

  scripts.forEach((script) => runPythonScript(script, aiDir));
};

const runPythonScript = (script, aiDir) => {
  const scriptPath = path.join(aiDir, script); // Correct full path to script

  // Ensure Python subprocess runs with the correct cwd
  const pythonProcess = spawn('python', [scriptPath], {
    cwd: aiDir, // Set working directory to ai_algorithms
    stdio: 'inherit' // Optional: stream stdout/stderr to Node console
  });

  pythonProcess.on('error', (err) => {
    console.error(`Failed to start script ${script}:`, err);
  });

  pythonProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.warn(`Script ${script} exited with code ${code} or signal ${signal}`);
    } else {
      console.log(`Script ${script} completed successfully.`);
    }
  });
};




/**
 * Connect to MongoDB and start the server only if successful.
 * @returns {Promise<void>}
 */
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");

    if (USE_HTTPS) {
      try {
        const https = require("https");

        /** @type {{ key: Buffer, cert: Buffer }} */
        const options = {
          key: fs.readFileSync(path.resolve(__dirname, SSL_KEY_PATH)),
          cert: fs.readFileSync(path.resolve(__dirname, SSL_CERT_PATH)),
        };

        https.createServer(options, app).listen(PORT, () => {
          console.log(`HTTPS Server running on port ${PORT}`);
          launchFrontend();
        });
      } catch (error) {
        console.error("Failed to start HTTPS server:", error);
        process.exit(1);
      }
    } else {
      app.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
        launchFrontend();
      });
    }

    // Fetch Canvas data every 3 minutes
    if (process.env.CANVAS_ACCESS_TOKEN) {
      (async () => {
        await fetchData();
        setInterval(fetchData, 180000); // 3 minutes
      })();
    } else {
      console.log("No Canvas access token in .env. Starting server without fetching Canvas Data.");
    }

    // Upload incidents every 5 and a half minutes (after 5 and a half-minute delay)
    setTimeout(() => {
      uploadIncidents();
      setInterval(uploadIncidents, 330000); // 5 and a half minutes
    }, 330000);

    // Train model immediately and every 4 minutes
    trainModel();
    setInterval(trainModel, 240000); // 4 minutes
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/**
 * @function launchFrontend
 * @description Launches the frontend React app as a child process on port 3000.
 * @returns {void}
 */
const launchFrontend = () => {
  const frontendDir = path.resolve(__dirname, "..", "bullyblock-dashboard");

  const npmProcess = spawn("npm", ["start"], {
    cwd: frontendDir,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: "3000" // force React frontend to run on port 3000
    }
  });

  npmProcess.on("error", (err) => {
    console.error("Failed to start the frontend:", err);
  });

  npmProcess.on("exit", (code) => {
    console.log(`Frontend process exited with code ${code}`);
  });

  console.log(`Frontend is running from ${frontendDir} on port 3000`);
};


/**
 * @exports mongoose connection for testing or external use.
 * @type {typeof mongoose}
 */
module.exports = mongoose;
