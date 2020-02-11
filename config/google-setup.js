const G_CONFIG = require('./google-config.js');
const { google } = require('googleapis');

/**
 * Init a new Google OAuth2 client
 */
const oauth2Client = new google.auth.OAuth2(
    G_CONFIG.clientID,
    G_CONFIG.clientSecret,
    G_CONFIG.callbackURL
);

module.exports = oauth2Client;