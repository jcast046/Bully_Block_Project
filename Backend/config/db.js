const mongoose = require('mongoose');

/**
 * Connects to MongoDB using Mongoose.
 * This function establishes a connection to the database using the URI stored in the environment variable `MONGO_URI`.
 * If the connection is successful, a success message is logged. If the connection fails, an error message is logged, and the process exits with an error code.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when the connection is established, rejects if there's an error.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, // Use the new URL parser to avoid deprecation warnings
      useUnifiedTopology: true, // Use the unified topology for better server selection and monitoring
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);  // Log the error message if connection fails
    process.exit(1);  // Exit the process with failure code 1 if connection fails
  }
};

// Call the function to connect to MongoDB
connectDB();

// Export the mongoose instance to be used elsewhere in the application
module.exports = mongoose;
