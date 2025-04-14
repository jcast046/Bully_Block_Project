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

describe('getDiscussions', () => {
  const mockDatasetPath = '/mock/initial_datasets.json';
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

  const fakeMessage = {
    id: 456,
    body: 'Private message.',
    sender_id: 99,
    recipient_id: 100,
    created_at: '2024-01-02T12:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    path.join.mockReturnValue(mockDatasetPath);

    // Simulate existing dataset
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify([]));
    fs.writeFileSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});

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

  it('should fetch, sanitize, deduplicate, and write new posts and messages to dataset', async () => {
    await getDiscussions();

    // Should sanitize and write 3 entries: post, comment, message
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

  it('should not write if no new data is found', async () => {
    // Simulate existing data already having entries
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
