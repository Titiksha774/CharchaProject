import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  const configured = process.env.MESSAGE_ENCRYPTION_KEY;

  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('MESSAGE_ENCRYPTION_KEY is required in production');
  }

  if (!configured) {
    return crypto.createHash('sha256').update('charcha-dev-message-key').digest();
  }

  const key = Buffer.from(configured, 'base64');
  if (key.length !== 32) {
    throw new Error('MESSAGE_ENCRYPTION_KEY must be a base64 encoded 32-byte key');
  }

  return key;
}

export function encryptText(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  return {
    content: encrypted.toString('base64'),
    contentIv: iv.toString('base64'),
    contentTag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptText(message) {
  if (!message.contentIv || !message.contentTag) {
    return message.content;
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(message.contentIv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(message.contentTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(message.content, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
