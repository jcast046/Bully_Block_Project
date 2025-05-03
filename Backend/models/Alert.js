/**
 * @file Alert.js
 * @description Mongoose schema and model for handling system-generated alerts related to incidents.
 */

const mongoose = require("mongoose");

/**
 * Mongoose schema for alerts associated with incidents.
 * 
 * @typedef {Object} Alert
 * @property {string} alert_id - Unique identifier for the alert.
 * @property {string} incident_id - Identifier linking the alert to a specific incident.
 * @property {string|null} admin_id - Optional ID of the admin handling the alert.
 * @property {"unresolved"|"resolved"|"reviewed"} alert_status - Status of the alert. Defaults to "unresolved".
 */
const AlertSchema = new mongoose.Schema({
    alert_id: { type: String, required: true, unique: true },
    incident_id: { type: String, required: true },
    admin_id: { type: String, required: false, default: null },
    alert_status: { 
        type: String, 
        required: true, 
        enum: ["unresolved", "resolved", "reviewed"], 
        default: "unresolved" 
    },
}, { collection: "Alerts" });

/**
 * Mongoose model for the Alert schema.
 * @type {mongoose.Model<Alert>}
 */
module.exports = mongoose.model("Alert", AlertSchema);
