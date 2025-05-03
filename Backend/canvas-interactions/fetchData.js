/**
 * Module dependencies.
 */
const getDiscussions = require("./getDiscussions");
const getParticipants = require("./getParticipants");

/**
 * Asynchronously fetches discussion and participant data.
 *
 * Uses Promise.all to run both data-fetching functions concurrently.
 * Logs a success message if both complete successfully, otherwise logs an error.
 *
 * @async
 * @function fetchData
 * @returns {Promise<void>} A promise that resolves when data fetching is complete.
 */
const fetchData = async () => {
    try {
        await Promise.all([getDiscussions(), getParticipants()]);
        console.log("Data fetched successfully.\n");
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

/**
 * Exports the fetchData function as a module.
 */
module.exports = fetchData;
