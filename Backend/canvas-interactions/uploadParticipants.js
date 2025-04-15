/**
 * @file uploadParticipants.js
 * @description Script to upload new users/participants in discussion boards
 */

require('dotenv').config({ path: './.env' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const participantsFile = path.join(__dirname, '..', '..', 'ai_algorithms', 'participants.json')

/**
 * Upload new users. Prevents duplicates. 
 * @returns 
 */
async function uploadParticipants() {
    if (!fs.existsSync(participantsFile)) {
        console.log('No participants file found.');
        return;
    }

    // read existing users
    const raw = fs.readFileSync(participantsFile, 'utf8');
    const participants = JSON.parse(raw);

    if (participants.length === 0) {
        console.log('No participants to process.');
        return;
    }

    for (const { user_id, username } of participants) {
        try {
            const existingUser = await User.findOne({ user_id });

            if (existingUser) {
                console.log(`User with ID ${user_id} already exists. Skipping.`);
            } else {
                // create new user
                await User.create({
                    user_id,
                    username
                });

                console.log(`Registered user: ${username} (ID: ${user_id})`);
            }
        } catch (err) {
            console.error(`Error processing ${user_id}:`, err.message);
        }
    }
}

module.exports = uploadParticipants;