// utils/authenticator.js
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import Logger from './logger.js';

// Ensure you have a dedicated encryption key in your .env file
const ENCRYPTION_KEY = process.env.TFA_ENCRYPTION_KEY; 
const IV_LENGTH = 16; // For AES, this is always 16

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('TFA_ENCRYPTION_KEY must be defined in .env and be 32 characters long.');
}

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        Logger.error('Failed to decrypt 2FA secret:', error);
        return null;
    }
}

/**
 * Generates a new 2FA secret and its corresponding QR code data URL.
 * @param {string} email The user's email to be included in the authenticator app.
 * @returns {object} { secret, qrCodeUrl }
 */
const generateSecret = async (email) => {
    const secret = speakeasy.generateSecret({
        length: 20,
        name: `Momentum Manager (${email})`,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    // secret.base32 is the key the user would type in manually
    return { secret: secret.base32, qrCodeUrl };
};

/**
 * Verifies a TOTP token against a user's secret.
 * @param {string} encryptedSecret The encrypted secret from the database.
 * @param {string} token The 6-digit token from the user's authenticator app.
 * @returns {boolean} True if the token is valid, false otherwise.
 */
const verifyToken = (encryptedSecret, token) => {
    Logger.info('[2FA DEBUG] Attempting to verify token.');
    Logger.info(`[2FA DEBUG] Received Encrypted Secret: ${encryptedSecret ? 'Exists' : 'NULL'}`);
    Logger.info(`[2FA DEBUG] Received Token from user: ${token}`);

    const decryptedSecret = decrypt(encryptedSecret);
    if (!decryptedSecret) {
        Logger.error('[2FA DEBUG] Decryption failed. The secret could not be decrypted.');
        return false;
    }

    Logger.info(`[2FA DEBUG] Decryption successful. Will use this secret for verification: ${decryptedSecret}`);

    const isVerified = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: token,
        window: 1, // Allows for a 30-second clock drift in either direction
    });

    Logger.info(`[2FA DEBUG] speakeasy.totp.verify() result: ${isVerified}`);

    return isVerified;
};

export {
    encrypt,
    generateSecret,
    verifyToken,
};
