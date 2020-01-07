const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
const calendarController = require('../../controllers/calendar-controller');

router.get('/', authCheck.mustLogin, (req, res) => {
    let jwt = req.body.decodedJWT;
    let data = {
        user: jwt.profile,
        habiticaID: !jwt.habiticaID ? "" : jwt.habiticaID,
        calendars: null
    };

    calendarController.listCal(jwt.sub)
    .then(calendars => data.calendars = calendars)
    .catch(err => console.log("settings error", err)) // API key not set up or something
    .finally(() => res.render("settings", data))
});

module.exports = router;