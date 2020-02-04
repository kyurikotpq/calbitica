const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.COOKIE_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

// Get a random string
function random() {
    let str = crypto.randomBytes(IV_LENGTH).toString('hex');
    str = str + new Date().getTime();
    return str;
}

// Encrypt a string
function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let cipherText = cipher.update(text);

    cipherText = Buffer.concat([cipherText, cipher.final()]);

    return iv.toString('hex') + ':' + cipherText.toString('hex');
}

// Decrypt a string
function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let cipherText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let plainText = decipher.update(cipherText);

    plainText = Buffer.concat([plainText, decipher.final()]);
    return plainText.toString();
}


let CryptUtil = { decrypt, encrypt, random };

module.exports = CryptUtil;