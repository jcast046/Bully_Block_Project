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

/**
 * @type {string} The MongoDB URI string for connection.
 */
const mongoURI = process.env.MONGO_URI;

/**
 * @type {express.Application} Express app instance.
 */
const app = express();
const PORT = process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS === "true";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || "./config/server.key";
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || "./config/server.cert";

// Import necessary modules
const fetchData = require("./canvas-interactions/fetchData");
const uploadIncidents = require("./incident-interactions/uploadIncidents"); // Import upload function

/**
 * @type {function} Middleware to sanitize user input to prevent XSS attacks.
 */
const sanitizeMiddleware = require("./middleware/sanitizeMiddleware");
app.use(xss());
app.use(sanitizeMiddleware);

// Enable CORS for frontend access
app.use(
  cors({
    origin: "http://localhost:3000", // React frontend address // Use HTTP for local dev
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Import Routes
const userRoutes = require("./routes/userRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const bullyRoutes = require("./routes/bullyRoutes");
const alertRoutes = require("./routes/alertRoutes");
const contentRoutes = require("./routes/contentRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const messageRoutes = require("./routes/messageRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const imageRoutes = require("./routes/imageRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

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

// Health check
app.get("/", (req, res) => {
  res.status(200).send("BullyBlock API is running...");
});

/**
 * Connect to MongoDB and start the server only if successful.
 * @returns {Promise<void>} Resolves once the connection is successful.
 */
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");

    // Set up HTTPS or HTTP server
    if (USE_HTTPS) {
      try {
        // Load SSL certificates
        const https = require("https");
        const options = {
          key: fs.readFileSync(path.resolve(__dirname, SSL_KEY_PATH)),
          cert: fs.readFileSync(path.resolve(__dirname, SSL_CERT_PATH)),
        };

        // Create HTTPS server
        https.createServer(options, app).listen(PORT, () => {
          console.log(`HTTPS Server running on port ${PORT}`);
        });
      } catch (error) {
        console.error("Failed to start HTTPS server:", error);
        process.exit(1); // Exit if HTTPS fails
      }
    } else {
      // Start HTTP server
      app.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
      });
    }

    // Fetch Canvas data every 3 minutes
    if (process.env.CANVAS_ACCESS_TOKEN) {
      (async () => {
        await fetchData();
      })();
      setInterval(fetchData, 180000); // 3 minutes
    } else {
      console.log("No Canvas access token in .env. Starting server without fetching Canvas Data.");
    }

    // Upload incidents every 5 minutes
    setInterval(uploadIncidents, 300000); // 5 minutes
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process on MongoDB connection failure
  });

// Export mongoose for use in other modules
module.exports = mongoose;
