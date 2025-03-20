require('dotenv').config({ path: './.env' });
const axios = require('axios');
const fs = require('fs');

console.log("Loaded ENV:", process.env.EMAIL, process.env.PASSWORD);

const API_URL = "http://localhost:3001/api/";
const PARTICIPANTS_FILE = './canvas-interactions/output/participants.json';

// Put EMAIL= and PASSWORD= in .env
// Must be a registered teacher/admin on the BullyBlock database
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
let TOKEN = '';

/**
 * @typedef {Object} Participant
 * @property {string} user_id - The ID of the participant as a string.
 * @property {string} username - The display name of the participant.
 */

/**
 * Authenticates the user and retrieves a token.
 * @returns {Promise<string | null>} The authentication token, or null if authentication fails.
 */
async function login() {
    try {
        const response = await axios.post(
            `${API_URL}users/login`,
            { email: EMAIL, password: PASSWORD },
            { headers: { "Content-Type": "application/json" } }
        );

        TOKEN = response.data.token;
        
        if (TOKEN) {
            console.log("Login successful! Token:", TOKEN);
            return TOKEN;
        } else {
            console.error("Login failed: No token received.");
            return null;
        }
    } catch (error) {
        console.error("Error logging in:", error.response ? error.response.data : error.message);
        return null;
    }
}

/**
 * Checks if a user exists in MongoDB and registers them if they are not found.
 * Prevents duplicate uploads.
 * @param {Participant[]} participants - Array of participants to process.
 */
async function checkAndRegisterUsers(participants) {
    for (const participant of participants) {
        const { user_id, username } = participant;

        try {
            // Check if user already exists in the database
            const userResponse = await axios.get(
                `${API_URL}users/canvas-id/${user_id}`,
                { headers: { "Authorization": `Bearer ${TOKEN}` } }
            );

            if (userResponse.status === 200) {
                console.log(`User with ID ${user_id} already exists.`);
                continue; // Skip registration
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // User does not exist, proceed with registration
                try {
                    const registerResponse = await axios.post(
                        `${API_URL}users/register-student`,
                        { user_id, username },
                        { headers: { "Authorization": `Bearer ${TOKEN}` } }
                    );

                    if (registerResponse.status === 201) {
                        console.log(`User with ID ${user_id} and username ${username} registered successfully.`);
                    }
                } catch (regError) {
                    console.error(`Error registering user ${user_id} (${username}):`, 
                        regError.response ? regError.response.data : regError.message);
                }
            } else {
                console.error(`Error checking user ${user_id} (${username}):`, 
                    error.response ? error.response.data : error.message);
            }
        }
    }
}

/**
 * Reads participants from the JSON file and processes them.
 */
function readParticipants() {
    if (fs.existsSync(PARTICIPANTS_FILE)) {
        try {
            /** @type {Participant[]} */
            const participants = JSON.parse(fs.readFileSync(PARTICIPANTS_FILE, 'utf8'));

            if (participants.length === 0) {
                console.log("No participants to process.");
                return;
            }

            checkAndRegisterUsers(participants);
        } catch (error) {
            console.error("Error reading participants file:", error.message);
        }
    } else {
        console.log('No participants file found.');
    }
}

/**
 * Main function to authenticate and process participant uploads.
 */
async function main() {
    const token = await login();
    if (token) {
        readParticipants();
    }
}

// Run the main function
main();
