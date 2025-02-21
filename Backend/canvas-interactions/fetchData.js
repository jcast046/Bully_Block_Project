const getDiscussions = require("./getDiscussions");
const getParticipants = require("./getParticipants");

const fetchData = async () => {
    try {
        await Promise.all([getDiscussions(), getParticipants()]);
        console.log("Data fetched successfully.");
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

module.exports = fetchData;