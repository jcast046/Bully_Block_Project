const axios = require('axios');
const fs = require('fs');
const path = require('path');
const courseId = 11104665; // CourseId for course we are tracking
const accessToken = process.env.CANVAS_ACCESS_TOKEN; // You will need a valid Canvas access token in .env
const discussionTopics = [24789449, 24789506, 24789472]; // insult, neutral, kindness
const url = 'https://canvas.instructure.com/api/v1';
const outputFile = path.join(__dirname, '../../ai_algorithms/participants.json');


/**
 * @typedef {Object} Participant
 * @property {string} user_id - The ID of the participant as a string.
 * @property {string} username - The display name of the participant.
 */

/**
 * Reads existing participants from the JSON file.
 * @returns {Participant[]} Array of existing participants.
 */
function readExistingParticipants() {
  try {
    if (fs.existsSync(outputFile)) {
      const data = fs.readFileSync(outputFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading existing participants:', error.message);
  }
  return [];
}

/**
 * Writes unique participants to the JSON file.
 * @param {Participant[]} participants - List of participants to save.
 */
function writeUniqueParticipants(participants) {
  const existingParticipants = readExistingParticipants();

  // Create a Map to store participants uniquely by user_id
  const participantMap = new Map();

  // Add existing participants to the map
  existingParticipants.forEach((participant) => {
    participantMap.set(participant.user_id, participant);
  });

  // Add new participants, avoiding duplicates by user_id
  participants.forEach((participant) => {
    participantMap.set(participant.user_id, participant);
  });

  // Convert the Map back to an array and write to file
  const uniqueParticipants = Array.from(participantMap.values());

  fs.writeFileSync(outputFile, JSON.stringify(uniqueParticipants, null, 2));
}


/**
 * Fetches participants from Canvas discussion topics.
 */
async function getParticipants() {
  /** @type {Participant[]} */
  let allParticipants = []; // Reset data for each execution

  for (const discussionTopicId of discussionTopics) {
    try {
      console.log(`Fetching discussion topic ID: ${discussionTopicId}`);
      const response = await axios.get(
        `${url}/courses/${courseId}/discussion_topics/${discussionTopicId}/view`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const discussionData = response.data;

      // Extract participants
      const participants = discussionData.participants.map((participant) => ({
        user_id: participant.id.toString(),
        username: participant.display_name,
      }));

      // Add participants to the array
      allParticipants.push(...participants);
    } catch (error) {
      console.error(
        `Error fetching discussion topic ID ${discussionTopicId}:`,
        error.response ? error.response.data : error.message
      );
    }
  }

  if (allParticipants.length > 0) {
    writeUniqueParticipants(allParticipants);
  } else {
    console.log('No participants data to save.');
  }
}

module.exports = getParticipants;
