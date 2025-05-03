/*
 * To run:
 * npm install --save-dev jest
 * npx jest getParticipants.test.js
 */

const fs = require('fs');
const axios = require('axios');
const getParticipants = require('../canvas-interactions/getParticipants');

jest.mock('axios');
jest.mock('fs');

/**
 * Test suite for `getParticipants` function which fetches participant data
 * from Canvas discussion topics and writes a deduplicated list to a JSON file.
 */
describe('getParticipants', () => {
  /**
   * Mock participants returned by the Canvas API.
   * @type {{ id: number, display_name: string }[]}
   */
  const mockParticipants = [
    { id: 1, display_name: 'Alice' },
    { id: 2, display_name: 'Bob' }
  ];

  /**
   * Mock API response structure mimicking Canvas discussion topic response.
   * @type {{ data: { participants: typeof mockParticipants } }}
   */
  const discussionResponse = {
    data: {
      participants: mockParticipants
    }
  };

  const outputFilePath = './canvas-interactions/output/participants.json';

  /**
   * Setup mocks before each test to simulate file system and API behavior.
   */
  beforeEach(() => {
    jest.clearAllMocks();

    // Simulate existing file with one overlapping and one unique participant
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify([
      { user_id: '2', username: 'Bob' },      // Duplicate
      { user_id: '3', username: 'Charlie' }   // Unique
    ]));

    // Simulate successful API response
    axios.get.mockResolvedValue(discussionResponse);

    // Stub writeFileSync to prevent actual file writes
    fs.writeFileSync.mockImplementation(() => {});
  });

  /**
   * Tests that participants are fetched and written to the output file
   * with duplicates removed based on user ID.
   */
  it('fetches participants from Canvas and writes unique data to file', async () => {
    await getParticipants();

    expect(axios.get).toHaveBeenCalledTimes(3); // For 3 discussion topics
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);

    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);

    // Assert deduplication result
    expect(writtenData).toEqual([
      { user_id: '2', username: 'Bob' },
      { user_id: '3', username: 'Charlie' },
      { user_id: '1', username: 'Alice' }
    ]);
  });

  /**
   * Tests that no file is written when the API returns no participants.
   */
  it('handles when no participants are returned', async () => {
    axios.get.mockResolvedValue({ data: { participants: [] } });

    await getParticipants();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('No participants data to save.');
  });

  /**
   * Tests that the function handles API errors gracefully without crashing.
   */
  it('handles API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API failure'));

    await getParticipants();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
