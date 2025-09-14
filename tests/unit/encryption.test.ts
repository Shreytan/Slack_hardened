import { encryptToken, decryptToken, validateEncryption } from '../../src/utils/encryption';

describe('Encryption Utils', () => {
  const testKey = 'test-key-32-chars-long-for-testing';
  const testData = 'sensitive-slack-token-data';

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = testKey;
  });

  describe('encryptToken', () => {
    it('should encrypt data successfully', () => {
      const encrypted = encryptToken(testData);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toEqual(testData);
    });

    it('should produce different encrypted values for same input', () => {
      const encrypted1 = encryptToken(testData);
      const encrypted2 = encryptToken(testData);
      expect(encrypted1).not.toEqual(encrypted2);
    });
  });

  describe('decryptToken', () => {
    it('should decrypt encrypted data successfully', () => {
      const encrypted = encryptToken(testData);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('should throw error with invalid encrypted data', () => {
      expect(() => {
        decryptToken('invalid-data');
      }).toThrow('Token decryption failed');
    });
  });

  describe('validateEncryption', () => {
    it('should return true for valid encryption setup', () => {
      const isValid = validateEncryption();
      expect(isValid).toBe(true);
    });
  });
});
