/**
 * @file uploadIncidents.js
 * @description Script to upload new incidents from a JSON file to MongoDB while preventing duplicates.
 */

const fs = require('fs');
const path = require('path');
const Incident = require('../models/Incident');

/**
 * Upload new incidents from a JSON file to MongoDB while avoiding duplicates.
 * Only incidents with "low" or "high" severity levels will be uploaded.
 * Duplicates are checked using the `incidentId` field.
 *
 * @async
 * @function uploadIncidents
 * @returns {Promise<void>} Resolves once all new incidents are uploaded or skipped.
 */
async function uploadIncidents() {
    try {
        console.log("Starting incident upload...");

        const filePath = path.join(__dirname, '..', '..', 'ai_algorithms', 'incident_reports.json');

        // Read the JSON file contents
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

            // Skip if severity level is not "low" or "high"
            if (severity_level !== 'low' && severity_level !== 'high') {
                skippedCount++;
                continue;
            }

            // Check for existing incident by incidentId
            const existing = await Incident.findOne({ incidentId: incident_id });
            if (existing) {
                skippedCount++;
                continue;
            }

            // Insert new incident if not a duplicate
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
