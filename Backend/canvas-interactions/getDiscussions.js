require('dotenv').config({ path: '../.env' });

const axios = require('axios');
const fs = require('fs');

const courseId = 11104665; // CourseId for course we are tracking
const accessToken = process.env.CANVAS_ACCESS_TOKEN; // You will need a valid Canvas access token in .env
const discussionTopics = [24348205, 24631580]; // Ids for discussion assignments we are tracking

const url = 'https://canvas.instructure.com/api/v1';

async function getDiscussions() {
  const extractedData = []; // Reset data for each execution

  for (const discussionTopicId of discussionTopics) {
    try {
      const response = await axios.get(`${url}/courses/${courseId}/discussion_topics/${discussionTopicId}/view`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const discussionData = response.data;

      if (!discussionData.view || !Array.isArray(discussionData.view)) {
        console.warn(`No view data found for discussion topic ID ${discussionTopicId}`);
        continue;
      }

      discussionData.view.forEach(post => {
        if (!post.id || !post.message) return;

        // Get post data
        const postEntry = {
          post_id: post.id.toString(),
          content: post.message,
          author_id: post.user_id ? post.user_id.toString() : null,
          timestamp: post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString()
        };

        extractedData.push(postEntry);

        if (post.replies && Array.isArray(post.replies)) {
          post.replies.forEach(reply => {
            if (!reply.id || !reply.message) return;

            // Get comment data
            const replyEntry = {
              comment_id: reply.id.toString(),
              content: reply.message,
              post_id: post.id.toString(),
              author_id: reply.user_id ? reply.user_id.toString() : null,
              timestamp: reply.created_at ? new Date(reply.created_at).toISOString() : new Date().toISOString()
            };

            extractedData.push(replyEntry);
          });
        }
      });

    } catch (error) {
      console.error(`Error fetching discussion topic ID ${discussionTopicId}:`, error.response ? error.response.data : error.message);
    }
  }

  // Save extracted data to JSON file
  fs.writeFileSync('./canvas-interactions/output/discussion_data.json', JSON.stringify(extractedData, null, 2));
  console.log('Data successfully saved to discussion_data.json');
}

module.exports = getDiscussions;
