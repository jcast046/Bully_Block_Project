const axios = require('axios');
const fs = require('fs');
const path = require('path');

const courseId = 11104665; // CourseId for course we are tracking
const accessToken = process.env.CANVAS_ACCESS_TOKEN; // You will need a valid Canvas access token in .env
const discussionTopics = [24789449, 24789506, 24789472]; // Topic IDs for insult, neutral, kindness discussions
const url = 'https://canvas.instructure.com/api/v1';
const outputFile = path.join(__dirname, '../../ai_algorithms/participants.json');

/**
 * @typedef {Object} Participant
 * @property {string} user_id - The ID of the participant as a string.
 * @property {string} username - The display name of the participant.
 */

/**
 * Reads and parses the existing participants from the output JSON file.
 * If the file does not exist or an error occurs, returns an empty array.
 *
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
 * Writes a unique list of participants to the output JSON file by combining
 * newly fetched participants with those already saved. Ensures no duplicates
 * based on `user_id`.
 *
 * @param {Participant[]} participants - New participants to merge and save.
 */
function writeUniqueParticipants(participants) {
  const existingParticipants = readExistingParticipants();

  // Create a map to store unique participants by user_id
  const participantMap = new Map();

  // Add existing participants to the map
  existingParticipants.forEach((participant) => {
    participantMap.set(participant.user_id, participant);
  });

  // Add new participants, overwriting duplicates
  participants.forEach((participant) => {
    participantMap.set(participant.user_id, participant);
  });

  // Convert the map back to an array and save it
  const uniqueParticipants = Array.from(participantMap.values());
  fs.writeFileSync(outputFile, JSON.stringify(uniqueParticipants, null, 2));
}

/**
 * Fetches participants from each discussion topic defined in `discussionTopics`
 * via the Canvas API. Consolidates all participants, deduplicates them,
 * and writes them to a local JSON file.
 *
 * Requires a valid Canvas API token to be set in the `CANVAS_ACCESS_TOKEN` environment variable.
 */
async function getParticipants() {
  /** @type {Participant[]} */
  let allParticipants = []; // Initialize fresh participant list

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

      // Map Canvas participant objects to simplified structure
      const participants = discussionData.participants.map((participant) => ({
        user_id: participant.id.toString(),
        username: participant.display_name,
      }));

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
