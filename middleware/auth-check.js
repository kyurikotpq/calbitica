/**
 * Middleware to check if user is logged in
 */
const oauth2Client = require('../config/google-setup');

// redirect to login page
const authCheckMustLogin = (req, res, next) => {
    if (!req.session.user || !req.session.access_token)
        res.redirect('/auth/login')
    else {
        // make the access token available to the client
        oauth2Client.setCredentials({
            access_token: req.session.access_token
        });
        next();
    }
}

// redirect to dashboard if logged in
const authCheckIsLoggedin = (req, res, next) => {
    (!req.session.user || !req.session.access_token)
        ? next()
        : res.redirect('/dashboard');
}

module.exports.mustLogin = authCheckMustLogin;
module.exports.isLoggedin = authCheckIsLoggedin;