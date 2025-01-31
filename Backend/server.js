require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const mongoURI = process.env.MONGO_URI
const app = express();

// Load SSL certificates
const options = {
    key: fs.readFileSync(path.join(__dirname, "config", "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "config", "server.cert"))
};

// Enable CORS for frontend access
app.use(cors({
    origin: 'http://localhost:3000', // React frontend address
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

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

// Set port for testing
const PORT = 3001;

// Health check
app.get("/", (req, res) => {
    res.status(200).send("BullyBlock API is running...");
});

// Connect to MongoDB and start the server only if successful
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MongoDB connected successfully");

        if (Object.keys(options).length) {
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
