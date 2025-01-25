require('dotenv').config();
const express = require('express');
const mongoose = require('./config/db');
const bullyRoutes = require('./routes/bullyRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/bully', bullyRoutes);
app.use('/api/Users', userRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
