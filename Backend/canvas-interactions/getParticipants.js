require('dotenv').config({ path: '../.env' });

const axios = require('axios');
const fs = require('fs');

const courseId = 11104665; // CourseId for course we are tracking
const accessToken = process.env.CANVAS_ACCESS_TOKEN; // You will need a valid Canvas access token in .env
const discussionTopics = [24348205, 24631580]; // Ids for discussion assignments we are tracking

const url = 'https://canvas.instructure.com/api/v1';

// Gets participants from each discussion topic
async function getParticipants() {
  const allParticipants = []; // Reset data for each execution

  for (const discussionTopicId of discussionTopics) {
    try {
      console.log(`Fetching discussion topic ID: ${discussionTopicId}`);
      const response = await axios.get(`${url}/courses/${courseId}/discussion_topics/${discussionTopicId}/view`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const discussionData = response.data;

      // Extract participants
      const participants = discussionData.participants.map(participant => ({
        user_id: participant.id.toString(),
        username: participant.display_name
      }));

      // Add participants to the allParticipants array
      allParticipants.push(...participants);
    } catch (error) {
      console.error(`Error fetching discussion topic ID ${discussionTopicId}:`, error.response ? error.response.data : error.message);
    }
  }

  // Save extracted participants to a JSON file
  if (allParticipants.length > 0) {
    fs.writeFileSync('./canvas-interactions/output/participants.json', JSON.stringify(allParticipants, null, 2));
  } else {
    console.log('No participants data to save.');
  }
}

module.exports =  getParticipants;