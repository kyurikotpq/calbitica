const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');

router.get('/', authCheck.mustLogin, (req, res) => {
    res.render("settings", {
        user: req.session.user,
        habiticaID: !req.session.habiticaID ? "" : req.session.habiticaID
    });
});

module.exports = router;