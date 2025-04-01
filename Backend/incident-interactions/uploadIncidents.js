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
 * @returns {Promise<void>} Resolves once all new incidents are uploaded.
 */
async function uploadIncidents() {
    try {
        console.log("Starting incident upload...");

        const filePath = path.join(__dirname, '..', '..', 'ai_algorithms', 'incident_reports.json');

        // Read the file content
        const fileData = fs.readFileSync(filePath, 'utf8');
        const incidents = JSON.parse(fileData);

        let newCount = 0;
        let skippedCount = 0;

        for (let incidentData of incidents) {
            const { content_id, incident_id, author_id, content_type, severity_level, status } = incidentData;

            // Only upload incidents with "low" or "high" severity levels
            if (severity_level !== 'low' && severity_level !== 'high') {
                skippedCount++;
                continue; // Skip this incident and move to the next one
            }

            // Try to update the incident if it exists, otherwise do nothing
            const result = await Incident.updateOne(
                { incidentId: incident_id }, // Find by incidentId
                { 
                    $setOnInsert: { 
                        contentId: content_id, 
                        authorId: author_id, 
                        contentType: content_type, 
                        severityLevel: severity_level, 
                        status: status 
                    } 
                }, 
                { upsert: false } // Do NOT insert if it doesn’t exist
            );

            if (result.matchedCount === 0) {
                // Only insert if it truly does not exist
                await Incident.create({
                    contentId: content_id,
                    incidentId: incident_id,
                    authorId: author_id,
                    contentType: content_type,
                    severityLevel: severity_level,
                    status: status,
                });
                newCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`Incident upload complete: ${newCount} new incidents added, ${skippedCount} skipped.`);
    } catch (err) {
        console.error('Error uploading incidents:', err);
    }
}

// Export function for use in server.js
module.exports = uploadIncidents;
