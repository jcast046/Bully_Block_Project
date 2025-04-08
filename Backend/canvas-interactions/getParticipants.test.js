/*
To run:
npm install --save-dev jest
npx jest getParticipants.test.js
*/


const fs = require('fs');
const axios = require('axios');
const getParticipants = require('../canvas-interactions/getParticipants');

jest.mock('axios');
jest.mock('fs');

describe('getParticipants', () => {
  const mockParticipants = [
    { id: 1, display_name: 'Alice' },
    { id: 2, display_name: 'Bob' }
  ];

  const discussionResponse = {
    data: {
      participants: mockParticipants
    }
  };

  const outputFilePath = './canvas-interactions/output/participants.json';

  beforeEach(() => {
    jest.clearAllMocks();

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify([
      { user_id: '2', username: 'Bob' }, // Existing entry to test deduplication
      { user_id: '3', username: 'Charlie' }
    ]));

    axios.get.mockResolvedValue(discussionResponse);
    fs.writeFileSync.mockImplementation(() => {});
  });

  it('fetches participants from Canvas and writes unique data to file', async () => {
    await getParticipants();

    expect(axios.get).toHaveBeenCalledTimes(3); // For 3 discussion topic IDs
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);

    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);

    // Expect deduplicated entries
    expect(writtenData).toEqual([
      { user_id: '2', username: 'Bob' },
      { user_id: '3', username: 'Charlie' },
      { user_id: '1', username: 'Alice' }
    ]);
  });

  it('handles when no participants are returned', async () => {
    axios.get.mockResolvedValue({ data: { participants: [] } });

    await getParticipants();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('No participants data to save.');
  });

  it('handles API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API failure'));

    await getParticipants();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
