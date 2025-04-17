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

// Core logic modules
const fetchData = require("./canvas-interactions/fetchData.js");
const uploadIncidents = require("./incident-interactions/uploadIncidents");
const uploadDiscussions = require("./canvas-interactions/uploadDiscussions.js");
const uploadParticipants = require("./canvas-interactions/uploadParticipants.js");
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
 * Health check route.
 *
 * @route GET /
 * @returns {string} Confirmation message.
 */
app.get("/", (req, res) => {
  res.status(200).send("BullyBlock API is running...");
});

/**
 * Uploads all data after model training.
 * @async
 * @function uploadAllData
 * @returns {Promise<void>}
 */
const uploadAllData = async () => {
  try {
    await uploadParticipants();
    console.log("Participants uploaded successfully.\n");
    await uploadDiscussions();
    console.log("Discussions uploaded successfully.\n");
    await uploadIncidents();
    console.log("Incidents uploaded successfully.\n");
    await uploadImages();
    console.log("Images uploaded successfully.\n");
  } catch (err) {
    console.error("Error uploading data after model training:", err);
  }
};

/**
 * Trains the AI model after fetching fresh data from Canvas.
 * Called on interval schedule after server starts.
 *
 * @async
 * @function trainModel
 * @returns {Promise<void>}
 */
const trainModel = async () => {
  try {
    console.log("Fetching fresh Canvas data before model training...");
    await fetchData(); // Fetch right before model training

    console.log("Starting model training...");
    const script = "pytorch_model_training.py";
    const aiDir = path.resolve(__dirname, "..", "ai_algorithms");
    const scriptPath = path.join(aiDir, script);

    const pythonProcess = spawn("python", [scriptPath], {
      cwd: aiDir,
      stdio: "inherit",
    });

    pythonProcess.on("error", (err) => {
      console.error(`Model training script failed to start:`, err);
    });

    pythonProcess.on("exit", async (code, signal) => {
      if (code !== 0) {
        console.warn(`Training script exited with code ${code} or signal ${signal}`);
      } else {
        console.log("Model training completed.\n");
        await uploadAllData(); // Upload only after training is complete
      }
    });
  } catch (err) {
    console.error("Error during fetch or training:", err);
  }
};

/**
 * Launches the frontend React application.
 *
 * @function launchFrontend
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
 * Initializes MongoDB and starts the server with HTTPS or HTTP.
 *
 * @function initializeServer
 * @returns {void}
 */
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");

    const startServer = () => {
      // Delay initial training by 30 seconds, then repeat every 6 minutes (360,000 ms)
      setTimeout(() => {
        trainModel(); // Initial run
        setInterval(trainModel, 360000); // Repeat every 6 minutes
      }, 30000); // Delay 30s

      launchFrontend();
    };

    if (USE_HTTPS) {
      try {
        const https = require("https");
        const options = {
          key: fs.readFileSync(path.resolve(__dirname, SSL_KEY_PATH)),
          cert: fs.readFileSync(path.resolve(__dirname, SSL_CERT_PATH)),
        };

        https.createServer(options, app).listen(PORT, () => {
          console.log(`HTTPS Server running on port ${PORT}`);
          startServer();
        });
      } catch (error) {
        console.error("Failed to start HTTPS server:", error);
        process.exit(1);
      }
    } else {
      app.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
        startServer();
      });
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/**
 * Exports for testing or external usage.
 *
 * @exports mongoose
 */
module.exports = mongoose;
