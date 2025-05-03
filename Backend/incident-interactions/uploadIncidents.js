/**
 * @file uploadIncidents.js
 * @description Script to upload new incidents from a JSON file to MongoDB while preventing duplicates.
 */

const fs = require('fs');
const path = require('path');
const Incident = require('../models/Incident');

/**
 * Uploads new incidents from a local JSON file into MongoDB, filtering and deduplicating records.
 *
 * Workflow:
 * 1. Reads `incident_reports.json` from the `ai_algorithms` directory.
 * 2. Filters incidents to only include those with `"low"` or `"high"` severity.
 * 3. Checks for duplicates using the `incidentId` field.
 * 4. Adds new incidents to the database and skips any duplicates or unsupported severities.
 *
 * @async
 * @function uploadIncidents
 * @returns {Promise<void>} A promise that resolves when all valid incidents are uploaded.
 */
async function uploadIncidents() {
    try {
        console.log("Starting incident upload...");

        // Absolute path to the JSON file containing incidents
        const filePath = path.join(__dirname, '..', '..', 'ai_algorithms', 'incident_reports.json');

        // Read file and parse JSON content
        const fileData = fs.readFileSync(filePath, 'utf8');
        const incidents = JSON.parse(fileData);

        let newCount = 0;
        let skippedCount = 0;

        for (let incidentData of incidents) {
            const {
                content_id,
                incident_id,
                author_id,
                content_type,
                severity_level,
                status
            } = incidentData;

            // Only upload incidents with severity "low" or "high"
            if (severity_level !== 'low' && severity_level !== 'high') {
                skippedCount++;
                continue;
            }

            // Skip if incident already exists based on incidentId
            const existing = await Incident.findOne({ incidentId: incident_id });
            if (existing) {
                skippedCount++;
                continue;
            }

            // Create and save new incident to MongoDB
            await Incident.create({
                contentId: content_id,
                incidentId: incident_id,
                authorId: author_id,
                contentType: content_type,
                severityLevel: severity_level,
                status: status
            });
            newCount++;
        }

        console.log(`Incident upload complete: ${newCount} new incidents added, ${skippedCount} skipped.`);
    } catch (err) {
        console.error('Error uploading incidents:', err);
    }
}

module.exports = uploadIncidents;
