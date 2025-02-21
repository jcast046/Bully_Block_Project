const getDiscussions = require("./getDiscussions");
const getParticipants = require("./getParticipants");


(async () => {
    try {
        await getDiscussions();
        await getParticipants();
        console.log("Initial discussion data fetched.");
    } catch (error) {
        console.error("Error:", error);
    }
})();