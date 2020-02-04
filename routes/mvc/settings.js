const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
const calendarController = require('../../controllers/calendar-controller');

// Render the settings page
router.get('/', authCheck.mustLogin, (req, res) => {
    let decodedJWT = req.body.decodedJWT;
    let data = {
        user: decodedJWT.profile,
        habiticaID: !decodedJWT.habiticaID ? "" : decodedJWT.habiticaID,
        calendars: null
    };

    calendarController.listCal(decodedJWT.sub)
        .then(calendars => data.calendars = calendars)
        .catch(err => { }) // API key not set up or something
        .finally(() => res.render("settings", data))
});

module.exports = router;