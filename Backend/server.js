require('dotenv').config();

const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();

// Load SSL certificates
const options = {
    key: fs.readFileSync(path.join(__dirname, "config", "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "config", "server.cert"))
};

// Middleware
app.use(express.json());

// Import Routes
const userRoutes = require("./routes/userRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const bullyRoutes = require("./routes/bullyRoutes");

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/bully", bullyRoutes);

// Start HTTPS Server
const PORT = process.env.PORT || 443;
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
});
