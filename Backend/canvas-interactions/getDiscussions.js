const axios = require('axios');
const fs = require('fs');
const path = require('path');

/** @type {number} */
const courseId = 11104665;

/** @type {string | undefined} */
const accessToken = process.env.CANVAS_ACCESS_TOKEN;

/** @type {number[]} */
const discussionTopics = [24789449, 24789506, 24789472];

const url = 'https://canvas.instructure.com/api/v1';
const datasetFilePath = path.join(__dirname, '../../ai_algorithms/initial_datasets.json');

/**
 * @typedef {Object} DiscussionPost
 * @property {string} contentType - Type of content ('post', 'comment', or 'message')
 * @property {string} content - The content of the post, comment, or message
 * @property {string} author_id - Author's ID
 * @property {string} post_id - ID of the post (for posts and comments)
 * @property {string} [comment_id] - ID of the comment (only for replies)
 * @property {string} [message_id] - ID of the message (for messages)
 * @property {string} date - The date in 'YYYY-MM-DDTHH:mm:ssZ' format
 */

/**
 * Ensures the directory for a given file path exists.
 * @param {string} filePath - The file path whose directory should be created.
 * @returns {void}
 */
function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Loads an existing dataset from a JSON file.
 * @returns {DiscussionPost[]} - Array of previously saved discussion entries.
 */
function loadDataset() {
    try {
        if (fs.existsSync(datasetFilePath)) {
            const data = fs.readFileSync(datasetFilePath, 'utf8');
            return /** @type {DiscussionPost[]} */ (JSON.parse(data));
        }
    } catch (error) {
        console.error(`Error reading ${datasetFilePath}:`, error);
    }
    return [];
}

/**
 * Converts a timestamp to ISO 8601 format.
 * @param {string} timestamp - The timestamp to convert.
 * @returns {string} - The converted timestamp in 'YYYY-MM-DDTHH:mm:ssZ' format.
 */
function convertTimestampToDate(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString();
}

/**
 * Sanitizes a content string by removing HTML and problematic characters.
 * @param {string} content - The raw content string.
 * @returns {string} - The sanitized content.
 */
function sanitizeContent(content) {
    return content
        .replace(/<[^>]+>/g, '')        // Remove HTML tags
        .replace(/‘|’/g, "'")           // Replace single curly quotes with straight quote
        .replace(/[^\x00-\x7F]/g, "");  // Remove non-ASCII characters
}

/**
 * Fetches Canvas discussions and stores non-duplicate posts and comments in a JSON dataset.
 * @returns {Promise<void>}
 */
async function getDiscussions() {
    const existingDataset = loadDataset();
    /** @type {DiscussionPost[]} */
    const extractedData = [...existingDataset];

    for (const discussionTopicId of discussionTopics) {
        try {
            const response = await axios.get(`${url}/courses/${courseId}/discussion_topics/${discussionTopicId}/view`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            /** @type {any} */
            const discussionData = response.data;
            if (!discussionData.view || !Array.isArray(discussionData.view)) {
                console.warn(`No view data found for discussion topic ID ${discussionTopicId}`);
                continue;
            }

            discussionData.view.forEach((post) => {
                if (!post.id || !post.message) return;

                /** @type {DiscussionPost} */
                const postEntry = {
                    contentType: 'post',
                    post_id: post.id.toString(),
                    content: sanitizeContent(post.message),
                    author_id: post.user_id ? post.user_id.toString() : null,
                    date: convertTimestampToDate(post.created_at),
                };

                if (!existingDataset.some(entry => entry.post_id === postEntry.post_id)) {
                    extractedData.push(postEntry);
                }

                if (Array.isArray(post.replies)) {
                    post.replies.forEach((reply) => {
                        if (!reply.id || !reply.message) return;

                        /** @type {DiscussionPost} */
                        const replyEntry = {
                            contentType: 'comment',
                            comment_id: reply.id.toString(),
                            content: sanitizeContent(reply.message),
                            post_id: post.id.toString(),
                            author_id: reply.user_id ? reply.user_id.toString() : null,
                            date: convertTimestampToDate(reply.created_at),
                        };

                        if (!existingDataset.some(entry => entry.comment_id === replyEntry.comment_id)) {
                            extractedData.push(replyEntry);
                        }
                    });
                }
            });
        } catch (error) {
            console.error(`Error fetching discussion topic ID ${discussionTopicId}:`, error.message);
        }
    }

    /*
    try {
        const messageResponse = await axios.get(`${url}/courses/${courseId}/conversations`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        /** @type {any[]} 
        const messages = messageResponse.data;
        messages.forEach((message) => {
            if (!message.id || !message.body) return;
            /** @type {DiscussionPost} 
            const messageEntry = {
                contentType: 'message',
                message_id: message.id.toString(),
                content: sanitizeContent(message.body),
                author_id: message.sender_id ? message.sender_id.toString() : null,
                recipient: message.recipient_id ? message.recipient_id.toString() : null,
                date: convertTimestampToDate(message.created_at),
            };
            if (!existingDataset.some(entry => entry.message_id === messageEntry.message_id)) {
                extractedData.push(messageEntry);
            }
        });
    } catch (error) {
        console.error(`Error fetching messages:`, error.message);
    }
    */

    /*
    extractedData.sort((a, b) => {
        const order = { post: 1, comment: 2 }; // Removed 'message' for now
        return order[a.contentType] - order[b.contentType];
    });
    */

    if (extractedData.length > existingDataset.length) {
        ensureDirectoryExists(datasetFilePath);
        fs.writeFileSync(datasetFilePath, JSON.stringify(extractedData, null, 2));
        console.log('New data appended to initial_datasets.json');
    } else {
        console.log('No new data found.');
    }
}

module.exports = getDiscussions;
