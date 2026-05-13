import CryptoJS from 'crypto-js';

const getEncryptionSecret = () => {
  const secret = process.env.ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error('ENCRYPTION_SECRET is not configured');
  }

  return secret;
};

export const encryptToken = (token: string): string =>
  CryptoJS.AES.encrypt(token, getEncryptionSecret()).toString();

export const decryptToken = (encryptedToken: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, getEncryptionSecret());
  return bytes.toString(CryptoJS.enc.Utf8);
};