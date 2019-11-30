const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
// const gcal = require('../../controllers/gcal');

router.get('/settings', authCheck.mustLogin, (req, res) => {
    res.render("dashboard", { 
        user: req.session.user,
        habiticaAPI: req.session.habiticaAPI
    });
});

module.exports = router;