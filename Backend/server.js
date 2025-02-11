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

// Import canvas-interactions
const getDiscussions = require("./canvas-interactions/getDiscussions");

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

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/bully", bullyRoutes);
app.use("/api/alert", alertRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);

// Health check
app.get("/", (req, res) => {
    res.status(200).send("BullyBlock API is running...");
});

// Fetch discussions on startup
(async () => {
    try {
        await getDiscussions();
        console.log("Initial discussion data fetched.");
    } catch (error) {
        console.error("Error fetching initial discussion data:", error);
    }
})();

// Fetch discussions every minute
setInterval(async () => {
    try {
        console.log("Fetching discussion data...");
        await getDiscussions();
        console.log("Discussion data updated.");
    } catch (error) {
        console.error("Error updating discussion data:", error);
    }
}, 60000); // get discussions every 60 seconds (300,000 ms)

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
