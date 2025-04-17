/**
 * @file server.js
 * @description Entry point for BullyBlock server. Sets up API, MongoDB, AI training, image automation, and frontend launch.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const xss = require("xss-clean");
const { spawn } = require("child_process");

// Express app setup
/** @type {express.Application} */
const app = express();

/** @type {number|string} */
const PORT = process.env.PORT || 3001;
/** @type {boolean} */
const USE_HTTPS = process.env.USE_HTTPS === "true";
/** @type {string} */
const mongoURI = process.env.MONGO_URI;
/** @type {string} */
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || "./config/server.key";
/** @type {string} */
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || "./config/server.cert";

// Import core logic modules
const fetchData = require("./canvas-interactions/fetchData.js");
const uploadIncidents = require("./incident-interactions/uploadIncidents");
const uploadDiscussions = require("./canvas-interactions/uploadDiscussions.js");
const uploadImages = require("./image-interactions/uploadImages");

// Middleware
const sanitizeMiddleware = require("./middleware/sanitizeMiddleware");
app.use(xss());
app.use(sanitizeMiddleware);
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));
app.use(express.json());

// API routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/schools", require("./routes/schoolRoutes"));
app.use("/api/bully", require("./routes/bullyRoutes"));
app.use("/api/alert", require("./routes/alertRoutes"));
app.use("/api/content", require("./routes/contentRoutes"));
app.use("/api/incidents", require("./routes/incidentRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/images", require("./routes/imageRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

/**
 * Health check route
 * @route GET /
 * @returns {string} "BullyBlock API is running..."
 */
app.get("/", (req, res) => {
  res.status(200).send("BullyBlock API is running...");
});

/**
 * Trains the AI model and schedules image upload afterward
 * @function trainModel
 */
const trainModel = () => {
  const scripts = ["pytorch_model_training.py"];
  const aiDir = path.resolve(__dirname, "..", "ai_algorithms");

  scripts.forEach((script) => runPythonScript(script, aiDir));
};

/**
 * Runs a Python script and optionally triggers uploadImages
 * @function runPythonScript
 * @param {string} script - Name of the Python file
 * @param {string} aiDir - Directory where the script is located
 */
const runPythonScript = (script, aiDir) => {
  const scriptPath = path.join(aiDir, script);

  const pythonProcess = spawn("python", [scriptPath], {
    cwd: aiDir,
    stdio: "inherit",
  });

  pythonProcess.on("error", (err) => {
    console.error(`Failed to start script ${script}:`, err);
  });

  pythonProcess.on("exit", (code, signal) => {
    if (code !== 0) {
      console.warn(`Script ${script} exited with code ${code} or signal ${signal}`);
    } else {
      console.log(`Script ${script} completed successfully.`);
      console.log("Scheduling image upload in 20 seconds...");
      setTimeout(() => {
        uploadImages();
      }, 20000);
    }
  });
};

/**
 * Launches the frontend React app
 * @function launchFrontend
 */
const launchFrontend = () => {
  const frontendDir = path.resolve(__dirname, "..", "bullyblock-dashboard");

  const npmProcess = spawn("npm", ["start"], {
    cwd: frontendDir,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: "3000",
    },
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
 * Initializes MongoDB and starts the Express server
 */
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");

    if (USE_HTTPS) {
      try {
        const https = require("https");
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

    // Canvas data fetch every 3 minutes
    if (process.env.CANVAS_ACCESS_TOKEN) {
      (async () => {
        await fetchData();
        setInterval(fetchData, 180000); // 3 minutes
      })();
    } else {
      console.log("No Canvas access token in .env. Starting server without fetching Canvas Data.");
    }

    // Incident uploads every 5.5 minutes
    setTimeout(() => {
      uploadIncidents();
      setInterval(uploadIncidents, 330000); // 5.5 minutes
    }, 330000);

    // Discussion uploads every 5.5 minutes
    setTimeout(() => {
      uploadDiscussions();
      setInterval(uploadDiscussions, 330000); // 5.5 minutes
    }, 330000);

    // Regular image uploads every 5.5 minutes
    setTimeout(() => {
      uploadImages();
      setInterval(uploadImages, 330000); // 5.5 minutes
    }, 330000);

    // Train model every 4 minutes (includes delayed image upload after training)
    trainModel();
    setInterval(trainModel, 240000); // 4 minutes
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/**
 * Exports for testing or external use
 * @exports mongoose
 */
module.exports = mongoose;
