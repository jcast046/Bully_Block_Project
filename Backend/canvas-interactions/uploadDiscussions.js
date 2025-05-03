/** 
 * @file uploadDiscussions.js
 * @description Script to upload new discussion posts and comments from a JSON file to the database.
 */

const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * Reads discussion data from a JSON file and uploads it to the database.
 * - Adds new posts and comments if they don't already exist.
 * - Skips entries that already exist or are malformed.
 * 
 * @async
 * @function uploadDiscussions
 * @returns {Promise<void>} Resolves when all discussion data has been processed.
 * 
 * @example
 * // Run this script from a setup file or command line tool
 * uploadDiscussions();
 */
async function uploadDiscussions() {
    try {
        console.log("Starting upload of discussion posts and comments...");

        // Construct full path to the discussion dataset file
        const filePath = path.join(__dirname, '..', '..', 'ai_algorithms', 'initial_datasets.json');

        // Exit early if file doesn't exist
        if (!fs.existsSync(filePath)) {
            console.log("No discussion data file found.");
            return;
        }

        // Read and parse JSON file
        const fileData = fs.readFileSync(filePath, 'utf-8');
        const discussionData = JSON.parse(fileData);

        let postCount = 0;
        let commentCount = 0;
        let skipped = 0;

        // Iterate through all entries in the dataset
        for (let entry of discussionData) {
            const {
                contentType,
                post_id,
                comment_id,
                content,
                author_id,
                date
            } = entry;

            const timestamp = date ? new Date(date) : new Date();

            // Handle post entries
            if (contentType === 'post') {
                const exists = await Post.exists({ post_id });

                if (!exists) {
                    await Post.create({
                        post_id,
                        content,
                        author: author_id,
                        date: timestamp
                    });
                    postCount++;
                } else {
                    skipped++;
                }

            // Handle comment entries
            } else if (contentType === 'comment') {
                if (!comment_id) {
                    skipped++;
                    continue;
                }

                const exists = await Comment.exists({ comment_id });

                if (!exists) {
                    await Comment.create({
                        comment_id,
                        content,
                        author: author_id,
                        post: post_id,
                        date: timestamp
                    });
                    commentCount++;
                } else {
                    skipped++;
                }
            }
        }

        console.log(`Upload complete: ${postCount} new posts, ${commentCount} new comments, ${skipped} skipped.`);
    } catch (err) {
        console.error("Error uploading discussion data:", err);
    }
}

module.exports = uploadDiscussions;
