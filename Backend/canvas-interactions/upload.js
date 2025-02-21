require('dotenv').config({ path: './.env' });
const axios = require('axios');
const fs = require('fs');

const API_URL = "http://localhost:3001/api/";

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
let TOKEN = '';

// Login function to authenticate and get the token
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
        }
    } catch (error) {
        console.error("Error logging in:", error.response ? error.response.data : error.message);
    }
}

// Function to check if user exists in MongoDB, and upload if necessary
async function checkAndUploadUsers(participants) {
    for (const participant of participants) {
        const { user_id, username } = participant;
        try {
            // Check if user exists in MongoDB
            const userResponse = await axios.get(
                `${API_URL}users/canvas-id/${user_id}`,
                { headers: { "Authorization": `Bearer ${TOKEN}` } }
            );

            if (userResponse.status === 200) {
                console.log(`User ${username} exists in database.`);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // User does not exist, so register them
                try {
                    const registerResponse = await axios.post(
                        `${API_URL}users/register-student`,
                        { user_id: user_id, username: username },
                        { headers: { "Authorization": `Bearer ${TOKEN}` } }
                    );
                    
                    if (registerResponse.status === 201) {
                        console.log(`User ${username} registered successfully.`);
                    }
                } catch (regError) {
                    console.error(`Error registering user ${username} id ${user_id}:`, regError.response ? regError.response.data : regError.message);
                }
            } else {
                console.error(`Error checking user ${username}:`, error.response ? error.response.data : error.message);
            }
        }
    }
}

// Read participants from the JSON file
function readParticipants() {
    const filePath = './canvas-interactions/output/participants.json';
    if (fs.existsSync(filePath)) {
        const participants = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        checkAndUploadUsers(participants);
    } else {
        console.log('No participants file found.');
    }
}

// Main function
async function main() {
    const token = await login();
    if (token) {
        readParticipants();
    }
}

// Run the main function
main();