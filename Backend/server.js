require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const mongoURI = process.env.MONGO_URI
const app = express();
const PORT = process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS === "true";

// Enable CORS for frontend access
app.use(cors({
    origin: 'http://localhost:3000', // React frontend address // Use HTTP for local dev
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Middleware
app.use(express.json());

// Import Routes
const userRoutes = require("./routes/userRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const bullyRoutes = require("./routes/bullyRoutes");
const alertRoutes = require("./routes/alertRoutes");
const contentRoutes = require("./routes/contentRoutes");
const incidentRoutes = require("./routes/incidentRoutes");

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/bully", bullyRoutes);
app.use("/api/alert", alertRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/incident", incidentRoutes);

// Health check
app.get("/", (req, res) => {
    res.status(200).send("BullyBlock API is running...");
});

// Connect to MongoDB and start the server only if successful
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MongoDB connected successfully");

        if (USE_HTTPS) {
            // Load SSL certificates
            const https = require("https");
            const options = {
                key: fs.readFileSync(path.join(__dirname, "config", "server.key")),
                cert: fs.readFileSync(path.join(__dirname, "config", "server.cert"))
            };
            https.createServer(options, app).listen(PORT, () => {
                console.log(`HTTPS Server running on port ${PORT}`);
            });
        } else {
            app.listen(PORT, () => {
                console.log(`HTTP Server running on port ${PORT}`);
            });
        }
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });
