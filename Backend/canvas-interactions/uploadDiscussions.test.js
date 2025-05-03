/**
 * @file uploadDiscussions.test.js
 * @description Jest test suite for testing discussion uploading functions using mocked Axios requests.
 * 
 * To run:
 * npm install --save-dev jest axios-mock-adapter
 * npm test
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
  /**
   * Reset mock state before each test.
   */
  beforeEach(() => {
    mock.reset();
  });

  /**
   * Tests for the login function.
   */
  describe('login', () => {
    /**
     * Should return a token when login is successful.
     */
    it('should return a token on successful login', async () => {
      mock.onPost(`${API_URL}users/login`).reply(200, { token: 'test-token' });
      const token = await login();
      expect(token).toBe('test-token');
    });

    /**
     * Should return null if login fails (e.g. 401 Unauthorized).
     */
    it('should return null on failed login', async () => {
      mock.onPost(`${API_URL}users/login`).reply(401);
      const token = await login();
      expect(token).toBeNull();
    });
  });

  /**
   * Tests for the checkPostExists function.
   */
  describe('checkPostExists', () => {
    /**
     * Should return true if the post exists (HTTP 200).
     */
    it('should return true if post exists', async () => {
      mock.onGet(`${API_URL}posts/canvas-id/123`).reply(200);
      const exists = await checkPostExists('123');
      expect(exists).toBe(true);
    });

    /**
     * Should return false if the post does not exist (HTTP 404).
     */
    it('should return false if post does not exist', async () => {
      mock.onGet(`${API_URL}posts/canvas-id/999`).reply(404);
      const exists = await checkPostExists('999');
      expect(exists).toBe(false);
    });
  });

  /**
   * Tests for the checkCommentExists function.
   */
  describe('checkCommentExists', () => {
    /**
     * Should return true if the comment exists (HTTP 200).
     */
    it('should return true if comment exists', async () => {
      mock.onGet(`${API_URL}comments/canvas-id/abc`).reply(200);
      const exists = await checkCommentExists('abc');
      expect(exists).toBe(true);
    });

    /**
     * Should return false if the comment does not exist (HTTP 404).
     */
    it('should return false if comment does not exist', async () => {
      mock.onGet(`${API_URL}comments/canvas-id/xyz`).reply(404);
      const exists = await checkCommentExists('xyz');
      expect(exists).toBe(false);
    });
  });

  /**
   * Tests for the uploadPost function.
   */
  describe('uploadPost', () => {
    /**
     * Should log a success message when a post is uploaded.
     */
    it('should log success message if post uploads', async () => {
      console.log = jest.fn();
      mock.onPost(`${API_URL}posts`).reply(201);
      await uploadPost({ post_id: '456', content: 'Hi', author_id: '1', timestamp: new Date().toISOString() });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('uploaded successfully'));
    });
  });

  /**
   * Tests for the uploadComment function.
   */
  describe('uploadComment', () => {
    /**
     * Should log a success message when a comment is uploaded.
     */
    it('should log success message if comment uploads', async () => {
      console.log = jest.fn();
      mock.onPost(`${API_URL}comments`).reply(201);
      await uploadComment({ comment_id: '789', content: 'Yo', author_id: '2', post_id: '456', timestamp: new Date().toISOString() });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('uploaded successfully'));
    });
  });

  /**
   * Tests for processing discussion data in bulk.
   */
  describe('processDiscussionData', () => {
    /**
     * Should upload a new post and skip an existing comment.
     */
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
