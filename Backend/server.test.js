/*
To run:
npm install --save-dev jest
npx jest server.test.js
*/

jest.mock('mongoose');
jest.mock('fs');
jest.mock('path');
jest.mock('https');
jest.mock('./canvas-interactions/fetchData');
jest.mock('./incident-interactions/uploadIncidents');
jest.mock('./routes/userRoutes', () => jest.fn());
jest.mock('./routes/schoolRoutes', () => jest.fn());
jest.mock('./routes/bullyRoutes', () => jest.fn());
jest.mock('./routes/alertRoutes', () => jest.fn());
jest.mock('./routes/contentRoutes', () => jest.fn());
jest.mock('./routes/incidentRoutes', () => jest.fn());
jest.mock('./routes/messageRoutes', () => jest.fn());
jest.mock('./routes/postRoutes', () => jest.fn());
jest.mock('./routes/commentRoutes', () => jest.fn());
jest.mock('./routes/imageRoutes', () => jest.fn());
jest.mock('./routes/analyticsRoutes', () => jest.fn());
jest.mock('./middleware/sanitizeMiddleware', () => jest.fn((req, res, next) => next()));
jest.mock('xss-clean', () => jest.fn(() => (req, res, next) => next()));

const mongoose = require('mongoose');
const fs = require('fs');
const https = require('https');
const fetchData = require('./canvas-interactions/fetchData');
const uploadIncidents = require('./incident-interactions/uploadIncidents');

describe('server.js', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  test('should start HTTP server and call fetchData/uploadIncidents if connected', async () => {
    const mockListen = jest.fn((port, cb) => cb());
    const mockApp = { listen: mockListen, use: jest.fn(), get: jest.fn() };
    jest.spyOn(require('express'), 'default' in require('express') ? 'default' : 'default').mockReturnValue(mockApp);

    process.env.MONGO_URI = 'mongodb://test';
    process.env.USE_HTTPS = 'false';
    process.env.PORT = '4000';
    process.env.CANVAS_ACCESS_TOKEN = 'token123';

    // Fake mongoose connection resolve
    mongoose.connect.mockResolvedValueOnce();

    // Mock timers for setInterval and setTimeout
    jest.useFakeTimers();

    await require('./server'); // Trigger server logic

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://test', expect.any(Object));
    expect(mockListen).toHaveBeenCalledWith(4000, expect.any(Function));
    expect(fetchData).toHaveBeenCalledTimes(1);

    // Fast forward time to test setTimeout/setInterval
    jest.advanceTimersByTime(300000);
    expect(uploadIncidents).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test('should start HTTPS server when USE_HTTPS=true', async () => {
    const mockCreateServer = {
      listen: jest.fn((port, cb) => cb())
    };
    https.createServer.mockReturnValue(mockCreateServer);

    const mockApp = { listen: jest.fn(), use: jest.fn(), get: jest.fn() };
    jest.spyOn(require('express'), 'default' in require('express') ? 'default' : 'default').mockReturnValue(mockApp);

    process.env.MONGO_URI = 'mongodb://test';
    process.env.USE_HTTPS = 'true';
    process.env.SSL_KEY_PATH = './test.key';
    process.env.SSL_CERT_PATH = './test.cert';

    mongoose.connect.mockResolvedValueOnce();
    fs.readFileSync.mockReturnValue('cert-content');

    await require('./server');

    expect(https.createServer).toHaveBeenCalledWith(
      { key: 'cert-content', cert: 'cert-content' },
      expect.any(Object)
    );
    expect(mockCreateServer.listen).toHaveBeenCalled();
  });

  test('should exit process on MongoDB connection failure', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    mongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));

    process.env.MONGO_URI = 'mongodb://invalid';

    await require('./server');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should log warning if no CANVAS_ACCESS_TOKEN is provided', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockApp = { listen: jest.fn((port, cb) => cb()), use: jest.fn(), get: jest.fn() };
    jest.spyOn(require('express'), 'default' in require('express') ? 'default' : 'default').mockReturnValue(mockApp);

    process.env.MONGO_URI = 'mongodb://test';
    process.env.USE_HTTPS = 'false';
    delete process.env.CANVAS_ACCESS_TOKEN;

    mongoose.connect.mockResolvedValueOnce();
    await require('./server');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No Canvas access token'));
  });
});
