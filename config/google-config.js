/**
 * Information for Google OAuth2 client
 */
const G_CONFIG = {
    clientID: process.env.GCLIENT_ID,
    clientSecret: process.env.GCLIENT_SECRET,
    callbackURL: process.env.GCLIENT_REDIRECT,
    scopes: [
        'profile',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly'
    ]
};

module.exports = G_CONFIG;