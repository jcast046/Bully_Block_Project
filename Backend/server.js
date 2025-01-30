require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // Import CORS

const mongoURI = process.env.MONGO_URI;
const app = express();

// Load SSL certificates
const options = {
    key: fs.readFileSync(path.join(__dirname, "config", "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "config", "server.cert"))
};

// Middleware
app.use(express.json());

// Enable CORS for frontend access
app.use(cors({
    origin: 'http://localhost:3000', // React frontend address
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Import Routes
const userRoutes = require("./routes/userRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const bullyRoutes = require("./routes/bullyRoutes");

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/bully", bullyRoutes);

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Set port for testing
const PORT = 3001;

https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
});

