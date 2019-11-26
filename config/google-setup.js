const G_CONFIG = require('./google-config.js');
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    G_CONFIG.clientID,
    G_CONFIG.clientSecret,
    G_CONFIG.callbackURL
);

// using this client shall be set at the global level
google.options({ auth: oauth2Client });

module.exports = oauth2Client;