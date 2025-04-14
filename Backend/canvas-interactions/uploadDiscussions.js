/** 
* @file uploadDiscussions.js
* @description Script to upload new discussion posts and comments from a JSON file to the database
*/

const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * Upload new discussion posts and comments. Prevents duplicates.
 * @returns  {Promise<void>} Resolves once all new posts and comments are uploaded.
 */
async function uploadDiscussions() {
    try {
        console.log("Starting upload of discussion posts and comments...");

        const filePath = path.join(__dirname, '..', '..', 'ai_algorithms', 'initial_datasets.json');

        if (!fs.existsSync(filePath)) {
            console.log("No discussion data file found.");
            return;
        }

        // Read the file content
        const fileData = fs.readFileSync(filePath, 'utf-8');
        const discussionData = JSON.parse(fileData);

        let postCount = 0;
        let commentCount = 0;
        let skipped = 0;

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

            if (contentType === 'post') {
                const exists = await Post.exists({ post_id });

                // Create new post if it does not already exist
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
            } else if (contentType === 'comment') {
                if (!comment_id) {
                    skipped++;
                    continue;
                }

                const exists = await Comment.exists({ comment_id });

                // Create new comment if it does not exist 
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
