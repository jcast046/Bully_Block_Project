/*
To run:
npm install --save-dev jest
npx jest getDiscussions.test.js
*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const getDiscussions = require('../canvas-interactions/getDiscussions'); 

jest.mock('axios');
jest.mock('fs');
jest.mock('path');

/**
 * Test suite for the `getDiscussions` function.
 */
describe('getDiscussions', () => {
  /** @type {string} */
  const mockDatasetPath = '/mock/initial_datasets.json';

  /** @type {object} */
  const fakePost = {
    id: 123,
    message: '<p>Hello World!</p>',
    user_id: 42,
    created_at: '2024-01-01T12:00:00Z',
    replies: [
      {
        id: 321,
        message: 'Reply here!',
        user_id: 43,
        created_at: '2024-01-01T13:00:00Z',
      },
    ],
  };

  /** @type {object} */
  const fakeMessage = {
    id: 456,
    body: 'Private message.',
    sender_id: 99,
    recipient_id: 100,
    created_at: '2024-01-02T12:00:00Z',
  };

  /**
   * Reset mocks and set up default return values before each test.
   */
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock path resolution
    path.join.mockReturnValue(mockDatasetPath);

    // Mock file system behavior
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify([]));
    fs.writeFileSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});

    // Mock API responses for discussion and messages
    axios.get
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            view: [fakePost],
          },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: [fakeMessage],
        })
      );
  });

  /**
   * Verifies that getDiscussions fetches, sanitizes, deduplicates,
   * and writes new entries (post, comment, message) to the dataset.
   */
  it('should fetch, sanitize, deduplicate, and write new posts and messages to dataset', async () => {
    await getDiscussions();

    // Extract written dataset
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData).toHaveLength(3);

    const [postEntry, commentEntry, messageEntry] = writtenData;

    expect(postEntry).toMatchObject({
      contentType: 'post',
      post_id: '123',
      content: 'Hello World!',
      author_id: '42',
    });

    expect(commentEntry).toMatchObject({
      contentType: 'comment',
      post_id: '123',
      comment_id: '321',
      content: 'Reply here!',
      author_id: '43',
    });

    expect(messageEntry).toMatchObject({
      contentType: 'message',
      message_id: '456',
      content: 'Private message.',
      author_id: '99',
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockDatasetPath,
      expect.any(String)
    );
  });

  /**
   * Verifies that no write occurs if all entries already exist in the dataset.
   */
  it('should not write if no new data is found', async () => {
    // Simulate dataset with all expected entries already present
    fs.readFileSync.mockReturnValue(
      JSON.stringify([
        { post_id: '123', contentType: 'post' },
        { comment_id: '321', contentType: 'comment' },
        { message_id: '456', contentType: 'message' },
      ])
    );

    await getDiscussions();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});
