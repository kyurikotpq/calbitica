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

// using this client shall be set at the global level
google.options({ auth: oauth2Client });

/**
 * TEST: does this work?
 * ANSWER: Yeap! This will be triggered
 * upon a request involving expired tokens.
 * 
 * Sample response:
 *  {
        access_token: 'xxx',
        scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile',
        token_type: 'Bearer',
        id_token: 'yyy',
        expiry_date: 1580741972795
    }

 * However, as verifying the idToken will require yet another HTTP request
 * and/or MongoDB query (to check for the user's refresh_token)
 * I will not be using this.
 */

// oauth2Client.on("tokens", (tokens) => {
//     console.log('---------------------------')
//     console.log("we GOT TOKENS BOI", tokens)
// })

module.exports = oauth2Client;