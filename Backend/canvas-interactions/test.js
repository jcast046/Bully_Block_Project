const startCanvasScheduler = require("./canvasScheduler");


(async () => {
    try {
        startCanvasScheduler;
        console.log("Initial discussion data fetched.");
    } catch (error) {
        console.error("Error:", error);
    }
})();