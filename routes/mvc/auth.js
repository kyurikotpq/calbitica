const router = require('express').Router();

const G_CONFIG = require('../../config/google-config.js');
const oauth2Client = require('../../config/google-setup');

const authCheck = require('../../middleware/auth-check');
const authToken = require('../../middleware/auth-token');

// MVC Login
router.get('/login', authCheck.isLoggedin, (req, res) => {
    res.render('login');
})

// MVC Logout
router.get('/logout', (req, res) => {
    req.session = null; // invalidate all MVC sessions
    res.redirect('/'); // redirect back to home page
})

// redirect to google auth
router.get('/google', (req, res) => {
    // redirect user to a consent page
    const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        scope: G_CONFIG.scopes
    });

    res.redirect(url);
});


// callback for google to redirect to
router.get('/google/callback',
    // use the middleware to capture tokens
    // before we redirect to the dashboard page
    authToken,
    (req, res) => {
        res.redirect('/dashboard');
    }
);

module.exports = router;