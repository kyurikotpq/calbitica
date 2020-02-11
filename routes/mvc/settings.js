const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
const CalendarController = require('../../controllers/calendar-controller');

// Render the settings page
router.get('/', authCheck.mustLogin, (req, res) => {
    let decodedJWT = req.body.decodedJWT;
    let data = {
        user: decodedJWT.profile,
        habiticaID: !decodedJWT.habiticaID ? "" : decodedJWT.habiticaID,
        calendars: null
    };

    new CalendarController(res.locals.googleOAuth2Client)
        .listCal(decodedJWT.sub)
        .then(calendars => data.calendars = calendars)
        .catch(err => { }) // API key not set up or something
        .finally(() => res.render("settings", data))
});

module.exports = router;