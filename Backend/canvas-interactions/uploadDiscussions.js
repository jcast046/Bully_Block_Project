require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const fs = require('fs');

const API_URL = "http://localhost:3001/api/";

// Credentials from .env
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
let TOKEN = '';

/**
 * @typedef {Object} DiscussionEntry
 * @property {'post' | 'comment'} contentType - Type of discussion content.
 * @property {string} post_id - Unique ID of the post.
 * @property {string} [comment_id] - Unique ID of the comment (if applicable).
 * @property {string} content - Message content.
 * @property {string | null} author_id - Author's ID.
 * @property {string} timestamp - ISO timestamp of the post or comment.
 */

/**
 * Logs in to get an authentication token.
 * @returns {Promise<string | null>} The authentication token or null if login fails.
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
            console.log("Login successful!");
            return TOKEN;
        } else {
            console.error("Login failed: No token received.");
        }
    } catch (error) {
        console.error("Error logging in:", error.response ? error.response.data : error.message);
    }
    return null;
}

/**
 * Checks if a post already exists in the database.
 * @param {string} postId - The Canvas ID of the post.
 * @returns {Promise<boolean>} True if the post exists, otherwise false.
 */
async function checkPostExists(postId) {
    try {
        const response = await axios.get(`${API_URL}posts/canvas-id/${postId}`, {
            headers: { "Authorization": `Bearer ${TOKEN}` }
        });
        return response.status === 200;
    } catch (error) {
        return error.response && error.response.status !== 404;
    }
}

/**
 * Checks if a comment already exists in the database.
 * @param {string} commentId - The Canvas ID of the comment.
 * @returns {Promise<boolean>} True if the comment exists, otherwise false.
 */
async function checkCommentExists(commentId) {
    try {
        const response = await axios.get(`${API_URL}comments/canvas-id/${commentId}`, {
            headers: { "Authorization": `Bearer ${TOKEN}` }
        });
        return response.status === 200;
    } catch (error) {
        return error.response && error.response.status !== 404;
    }
}

/**
 * Uploads a post if it does not already exist.
 * @param {{ post_id: string, content: string, author_id: string | null, timestamp: string }} postData - The post data.
 * @returns {Promise<void>}
 */
async function uploadPost(postData) {
    try {
        const response = await axios.post(
            `${API_URL}posts`,
            postData,
            { headers: { "Authorization": `Bearer ${TOKEN}` } }
        );
        if (response.status === 201) {
            console.log(`Post ${postData.post_id} uploaded successfully.`);
        }
    } catch (error) {
        console.error(`Error uploading post ${postData.post_id}:`, error.response ? error.response.data : error.message);
    }
}

/**
 * Uploads a comment if it does not already exist.
 * @param {{ comment_id: string, content: string, author_id: string | null, post_id: string, timestamp: string }} commentData - The comment data.
 * @returns {Promise<void>}
 */
async function uploadComment(commentData) {
    try {
        const response = await axios.post(
            `${API_URL}comments`,
            commentData,
            { headers: { "Authorization": `Bearer ${TOKEN}` } }
        );
        if (response.status === 201) {
            console.log(`Comment ${commentData.comment_id} uploaded successfully.`);
        }
    } catch (error) {
        console.error(`Error uploading comment ${commentData.comment_id}:`, error.response ? error.response.data : error.message);
    }
}

/**
 * Processes and uploads discussion data while preventing duplicates.
 * @param {DiscussionEntry[]} discussionData - The list of discussion entries.
 * @returns {Promise<void>}
 */
async function processDiscussionData(discussionData) {
    for (const entry of discussionData) {
        const { contentType, post_id, comment_id, content, author_id, timestamp } = entry;

        if (contentType === 'post') {
            if (!(await checkPostExists(post_id))) {
                await uploadPost({ post_id, content, author_id, timestamp });
            } else {
                console.log(`Skipping duplicate post ${post_id}.`);
            }
        } else if (contentType === 'comment' && comment_id) {
            if (!(await checkCommentExists(comment_id))) {
                await uploadComment({ comment_id, content, author_id, post_id, timestamp });
            } else {
                console.log(`Skipping duplicate comment ${comment_id}.`);
            }
        }
    }
}

/**
 * Reads discussion data from the JSON file and processes it.
 * @returns {Promise<void>}
 */
async function readDiscussionData() {
    const filePath = '../../ai_algorithms/initial_datasets.json';

    if (fs.existsSync(filePath)) {
        try {
            const discussionData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(discussionData) && discussionData.length > 0) {
                await processDiscussionData(discussionData);
            } else {
                console.log("No valid discussion data found.");
            }
        } catch (error) {
            console.error("Error reading discussion data:", error.message);
        }
    } else {
        console.log('No discussion data file found.');
    }
}

/**
 * Main function to execute the process.
 * @returns {Promise<void>}
 */
async function main() {
    const token = await login();
    if (token) {
        await readDiscussionData();
    }
}

// Run the script
main();
