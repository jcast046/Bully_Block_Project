require('dotenv').config({ path: './.env' });
const axios = require('axios');
const fs = require('fs');

const API_URL = "http://localhost:3001/api/";  // Make sure this is the correct URL for your API

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

// Function to check if post exists by canvas_id
async function checkPostExists(postId) {
    try {
        const response = await axios.get(`${API_URL}posts/canvas-id/${postId}`, {
            headers: { "Authorization": `Bearer ${TOKEN}` }
        });
        if (response.status === 200) {
            console.log(`Post with canvas ID ${postId} already exists.`);
            return true;
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(`Post with canvas ID ${postId} does not exist.`);
            return false;
        }
        console.error(`Error checking post ${postId}:`, error.response ? error.response.data : error.message);
    }
    return false;
}

// Function to check if comment exists by canvas_id
async function checkCommentExists(commentId) {
    try {
        const response = await axios.get(`${API_URL}comments/canvas-id/${commentId}`, {
            headers: { "Authorization": `Bearer ${TOKEN}` }
        });
        if (response.status === 200) {
            console.log(`Comment with canvas ID ${commentId} already exists.`);
            return true;
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(`Comment with canvas ID ${commentId} does not exist.`);
            return false;
        }
        console.error(`Error checking comment ${commentId}:`, error.response ? error.response.data : error.message);
    }
    return false;
}

// Function to upload post
async function uploadPost(postData) {
    try {
        const response = await axios.post(
            `${API_URL}posts`, 
            postData, 
            { headers: { "Authorization": `Bearer ${TOKEN}` } }
        );
        if (response.status === 201) {
            console.log(`Post with ID ${postData.post_id} uploaded successfully.`);
        }
    } catch (error) {
        console.error(`Error uploading post ${postData.post_id}:`, error.response ? error.response.data : error.message);
    }
}

// Function to upload comment
async function uploadComment(commentData) {
    try {
        const response = await axios.post(
            `${API_URL}comments`, 
            commentData, 
            { headers: { "Authorization": `Bearer ${TOKEN}` } }
        );
        if (response.status === 201) {
            console.log(`Comment with ID ${commentData.comment_id} uploaded successfully.`);
        }
    } catch (error) {
        console.error(`Error uploading comment ${commentData.comment_id}:`, error.response ? error.response.data : error.message);
    }
}

// Function to process the discussion data
async function processDiscussionData(discussionData) {
    for (const entry of discussionData) {
        const { contentType, post_id, comment_id, content, author_id, timestamp } = entry;

        if (contentType === 'post') {
            const exists = await checkPostExists(post_id);
            if (!exists) {
                const postData = { post_id, content, author_id, timestamp };
                await uploadPost(postData);
            }
        } else if (contentType === 'comment') {
            const exists = await checkCommentExists(comment_id);
            if (!exists) {
                const commentData = { comment_id, content, author_id, post_id, timestamp };
                await uploadComment(commentData);
            }
        }
    }
}

// Read discussion data from the JSON file
function readDiscussionData() {
    const filePath = './canvas-interactions/output/discussion_data.json';
    if (fs.existsSync(filePath)) {
        const discussionData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        processDiscussionData(discussionData);  // Process the discussion data
    } else {
        console.log('No discussion data file found.');
    }
}

// Main function
async function main() {
    const token = await login();
    if (token) {
        readDiscussionData();
    }
}

// Run the main function
main();
