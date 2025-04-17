/**
 * @file uploadParticipants.js
 * @description Script to upload new users/participants in discussion boards
 */

require('dotenv').config({ path: './.env' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const participantsFile = path.join(__dirname, '..', '..', 'ai_algorithms', 'participants.json');

/**
 * Upload new discussion users/participants. Prevents duplicates.
 * @returns {Promise<void>} Resolves once all new users are processed.
 */
async function uploadParticipants() {
    try {
        console.log("Starting upload of discussion participants...");

        if (!fs.existsSync(participantsFile)) {
            console.log('No participants file found.');
            return;
        }

        const raw = fs.readFileSync(participantsFile, 'utf8');
        const participants = JSON.parse(raw);

        if (participants.length === 0) {
            console.log('No participants to process.');
            return;
        }

        let createdCount = 0;
        let skippedCount = 0;

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

        console.log(`Upload complete: ${createdCount} new users, ${skippedCount} skipped.`);
    } catch (err) {
        console.error("Error uploading participant data:", err);
    }
}

module.exports = uploadParticipants;
