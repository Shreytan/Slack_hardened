import { encryptToken, decryptToken, validateEncryption } from '../../src/utils/encryption';

// Mock logger to prevent console output during tests
jest.mock('../../src/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Encryption Utils', () => {
  const testKey = 'test-key-32-characters-long-12345';
  const testData = 'xoxb-test-slack-token-12345';

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = testKey;
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('encryptToken', () => {
    it('should encrypt a token successfully', () => {
      const encrypted = encryptToken(testData);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toEqual(testData);
      expect(encrypted.length).toBeGreaterThan(testData.length);
    });

    it('should produce different encrypted values for same input', () => {
      const encrypted1 = encryptToken(testData);
      const encrypted2 = encryptToken(testData);
      
      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('should throw error when no encryption key provided', () => {
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => {
        encryptToken(testData);
      }).toThrow('ENCRYPTION_KEY environment variable is required');
      
      process.env.ENCRYPTION_KEY = testKey;
    });

    it('should use provided key over environment variable', () => {
      const customKey = 'custom-key-32-characters-long-abc';
      const encrypted = encryptToken(testData, customKey);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('decryptToken', () => {
    it('should decrypt an encrypted token successfully', () => {
      const encrypted = encryptToken(testData);
      const decrypted = decryptToken(encrypted);
      
      expect(decrypted).toEqual(testData);
    });

    it('should work with custom key', () => {
      const customKey = 'custom-key-32-characters-long-xyz';
      const encrypted = encryptToken(testData, customKey);
      const decrypted = decryptToken(encrypted, customKey);
      
      expect(decrypted).toEqual(testData);
    });

    it('should throw error with wrong key', () => {
      const encrypted = encryptToken(testData);
      const wrongKey = 'wrong-key-32-characters-long-wrong';
      
      expect(() => {
        decryptToken(encrypted, wrongKey);
      }).toThrow('Token decryption failed');
    });

    it('should throw error with corrupted data', () => {
      const corrupted = 'invalid-encrypted-data';
      
      expect(() => {
        decryptToken(corrupted);
      }).toThrow('Token decryption failed');
    });

    it('should throw error when no encryption key provided', () => {
      const encrypted = encryptToken(testData);
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => {
        decryptToken(encrypted);
      }).toThrow('ENCRYPTION_KEY environment variable is required');
      
      process.env.ENCRYPTION_KEY = testKey;
    });
  });

  describe('validateEncryption', () => {
    it('should return true for valid encryption setup', () => {
      const isValid = validateEncryption();
      expect(isValid).toBe(true);
    });

    it('should return false when encryption key is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      
      const isValid = validateEncryption();
      expect(isValid).toBe(false);
      
      process.env.ENCRYPTION_KEY = testKey;
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a valid encryption key', () => {
      const { generateEncryptionKey } = require('../../src/utils/encryption');
      const key = generateEncryptionKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(40); // Base64 encoded 256-bit key
    });

    it('should generate different keys each time', () => {
      const { generateEncryptionKey } = require('../../src/utils/encryption');
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toEqual(key2);
    });

    it('should generate keys that work for encryption', () => {
      const { generateEncryptionKey } = require('../../src/utils/encryption');
      const key = generateEncryptionKey();
      const testText = 'test-encryption-with-generated-key';
      
      const encrypted = encryptToken(testText, key);
      const decrypted = decryptToken(encrypted, key);
      
      expect(decrypted).toEqual(testText);
    });
  });
});
