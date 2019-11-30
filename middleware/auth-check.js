/**
 * Middleware to check if user is logged in
 */
const oauth2Client = require('../config/google-setup');
const crypt = require('../util/crypt');

/**
 * Is the user logged in? No -> Redirect to login page
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const authCheckMustLogin = (req, res, next) => {
    if (!req.session.user || !req.session.access_token)
        res.redirect('/auth/login')
    else {
        // make the access token available to the G client
        oauth2Client.setCredentials({
            access_token: crypt.decrypt(req.session.access_token)
        });
        next();
    }
}

/**
 * Is the user logged in ? Yes -> redirect to dashboard
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const authCheckIsLoggedin = (req, res, next) => {
    (!req.session.user || !req.session.access_token)
        ? next()
        : res.redirect('/dashboard');
}

module.exports.mustLogin = authCheckMustLogin;
module.exports.isLoggedin = authCheckIsLoggedin;