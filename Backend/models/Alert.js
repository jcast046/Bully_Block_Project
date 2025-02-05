const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
    alert_id: { type: String, required: true, unique: true },
    incident_id: { type: String, required: true },
    admin_id: { type: String, required: false, default: null },
    alert_status: { type: String, required: true, enum: ["unresolved", "resolved", "reviewed"], default: "unresolved" },
}, { collection: "Alerts" });

module.exports = mongoose.model("Alert", AlertSchema);
