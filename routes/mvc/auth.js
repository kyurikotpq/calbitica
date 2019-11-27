const router = require('express').Router();

const G_CONFIG = require('../../config/google-config.js');
const oauth2Client = require('../../config/google-setup');

const authCheck = require('../../middleware/auth-check');
const authToken = require('../../middleware/auth-token');

router.get('/login', authCheck.isLoggedin, (req, res) => {
    res.render('login');
})
router.get('/logout', (req, res) => {
    req.session = null; // invalidate all sessions
    
    // invalidate tokens in DB!

    // redirect back to home page
    res.redirect('/');
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
    // use the middleware before we fire the cb function
    authToken,
    (req, res) => {
        res.redirect('/dashboard');
    }
);

module.exports = router;