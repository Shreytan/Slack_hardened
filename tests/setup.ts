import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite::memory:';
process.env.ENCRYPTION_KEY = 'test-key-32-chars-long-for-testing';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Mock external services
jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => ({
    conversations: {
      list: jest.fn().mockResolvedValue({
        channels: [
          { id: 'C1234567890', name: 'general', is_private: false },
          { id: 'C0987654321', name: 'private', is_private: true }
        ]
      })
    },
    chat: {
      postMessage: jest.fn().mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C1234567890'
      })
    }
  }))
}));

// Setup and teardown for database
beforeEach(async () => {
  // Database setup if needed
});

afterEach(async () => {
  // Cleanup
});
