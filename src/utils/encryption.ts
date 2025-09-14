import crypto from 'crypto';
import { logger } from '../logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
}

export function encryptToken(text: string, masterKey?: string): string {
  const key = masterKey || process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const derivedKey = deriveKey(key, salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    cipher.setAAD(salt);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error: any) {
    logger.error('Token encryption failed', { error: error.message });
    throw new Error('Token encryption failed');
  }
}

export function decryptToken(encryptedData: string, masterKey?: string): string {
  const key = masterKey || process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  try {
    const combined = Buffer.from(encryptedData, 'base64');
    
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, TAG_POSITION);
    const authTag = combined.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = combined.slice(ENCRYPTED_POSITION);
    
    const derivedKey = deriveKey(key, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(salt);
    
    // Fix: Use Buffer for encrypted data, then convert to string
    const decryptedBuffer = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decryptedBuffer.toString('utf8');
  } catch (error: any) {
    logger.error('Token decryption failed', { error: error.message });
    throw new Error('Token decryption failed');
  }
}

export function validateEncryption(): boolean {
  try {
    const testData = 'test-encryption-validation';
    const encrypted = encryptToken(testData);
    const decrypted = decryptToken(encrypted);
    return decrypted === testData;
  } catch (error: any) {
    logger.error('Encryption validation failed', { error: error.message });
    return false;
  }
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}
