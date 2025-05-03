/**
 * @file uploadParticipants.js
 * @description Script to upload new users/participants in discussion boards.
 * It reads a JSON file of participants, checks if they already exist in the database,
 * and uploads only new users to avoid duplication.
 */

require('dotenv').config({ path: './.env' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const participantsFile = path.join(__dirname, '..', '..', 'ai_algorithms', 'participants.json');

/**
 * Uploads new discussion participants from a JSON file.
 * Skips users that already exist in the database.
 * Logs the count of users created and skipped.
 * 
 * @async
 * @function uploadParticipants
 * @returns {Promise<void>} Resolves when all participant records have been processed.
 */
async function uploadParticipants() {
    try {
        console.log("Starting upload of discussion participants...");

        // Check if the participants file exists
        if (!fs.existsSync(participantsFile)) {
            console.log('No participants file found.');
            return;
        }

        // Read and parse the participants JSON file
        const raw = fs.readFileSync(participantsFile, 'utf8');
        const participants = JSON.parse(raw);

        // Exit early if no participants are listed
        if (participants.length === 0) {
            console.log('No participants to process.');
            return;
        }

        let createdCount = 0;
        let skippedCount = 0;

        // Iterate through each participant
        for (const { user_id, username } of participants) {
            try {
                const existingUser = await User.findOne({ user_id });

                if (existingUser) {
                    skippedCount++;
                } else {
                    await User.create({ user_id, username });
                    createdCount++;
                }
            } catch (err) {
                console.error(`Error processing ${user_id}:`, err.message);
            }
        }

        // Log summary of the upload process
        console.log(`Upload complete: ${createdCount} new users, ${skippedCount} skipped.`);
    } catch (err) {
        console.error("Error uploading participant data:", err);
    }
}

module.exports = uploadParticipants;
