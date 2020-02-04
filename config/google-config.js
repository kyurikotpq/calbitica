/**
 * Information for Google OAuth2 client
 */
const G_CONFIG = {
    clientID: process.env.GCLIENT_ID,
    clientSecret: process.env.GCLIENT_SECRET,
    callbackURL: process.env.GCLIENT_REDIRECT,

    // Scopes required for our app to work -
    // we need access to the user's calendar
    scopes: [
        'profile',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
    ]
};

module.exports = G_CONFIG;