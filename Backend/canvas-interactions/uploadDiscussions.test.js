/*
To run:
npm install --save-dev jest axios-mock-adapter
npm test
*/

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const fs = require('fs');
const path = require('path');
const {
  login,
  checkPostExists,
  checkCommentExists,
  uploadPost,
  uploadComment,
  processDiscussionData,
} = require('../canvas-interactions/uploadDiscussions'); 

const mock = new MockAdapter(axios);
const API_URL = "http://localhost:3001/api/";

describe('Discussion Uploader', () => {
  beforeEach(() => {
    mock.reset();
  });

  describe('login', () => {
    it('should return a token on successful login', async () => {
      mock.onPost(`${API_URL}users/login`).reply(200, { token: 'test-token' });
      const token = await login();
      expect(token).toBe('test-token');
    });

    it('should return null on failed login', async () => {
      mock.onPost(`${API_URL}users/login`).reply(401);
      const token = await login();
      expect(token).toBeNull();
    });
  });

  describe('checkPostExists', () => {
    it('should return true if post exists', async () => {
      mock.onGet(`${API_URL}posts/canvas-id/123`).reply(200);
      const exists = await checkPostExists('123');
      expect(exists).toBe(true);
    });

    it('should return false if post does not exist', async () => {
      mock.onGet(`${API_URL}posts/canvas-id/999`).reply(404);
      const exists = await checkPostExists('999');
      expect(exists).toBe(false);
    });
  });

  describe('checkCommentExists', () => {
    it('should return true if comment exists', async () => {
      mock.onGet(`${API_URL}comments/canvas-id/abc`).reply(200);
      const exists = await checkCommentExists('abc');
      expect(exists).toBe(true);
    });

    it('should return false if comment does not exist', async () => {
      mock.onGet(`${API_URL}comments/canvas-id/xyz`).reply(404);
      const exists = await checkCommentExists('xyz');
      expect(exists).toBe(false);
    });
  });

  describe('uploadPost', () => {
    it('should log success message if post uploads', async () => {
      console.log = jest.fn();
      mock.onPost(`${API_URL}posts`).reply(201);
      await uploadPost({ post_id: '456', content: 'Hi', author_id: '1', timestamp: new Date().toISOString() });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('uploaded successfully'));
    });
  });

  describe('uploadComment', () => {
    it('should log success message if comment uploads', async () => {
      console.log = jest.fn();
      mock.onPost(`${API_URL}comments`).reply(201);
      await uploadComment({ comment_id: '789', content: 'Yo', author_id: '2', post_id: '456', timestamp: new Date().toISOString() });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('uploaded successfully'));
    });
  });

  describe('processDiscussionData', () => {
    it('should upload new post and skip existing comment', async () => {
      mock
        .onGet(`${API_URL}posts/canvas-id/p1`).reply(404)
        .onGet(`${API_URL}comments/canvas-id/c1`).reply(200)
        .onPost(`${API_URL}posts`).reply(201);

      const data = [
        { contentType: 'post', post_id: 'p1', content: 'Hello', author_id: '1', timestamp: new Date().toISOString() },
        { contentType: 'comment', comment_id: 'c1', post_id: 'p1', content: 'Reply', author_id: '2', timestamp: new Date().toISOString() },
      ];

      console.log = jest.fn();
      await processDiscussionData(data);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('uploaded successfully'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Skipping duplicate comment'));
    });
  });
});
