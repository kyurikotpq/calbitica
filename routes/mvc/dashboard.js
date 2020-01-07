const bodyParser = require('body-parser');
const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
const DateUtil = require('../../util/date');
const habiticaController = require('../../controllers/h-controller');
const calendarController = require('../../controllers/calendar-controller');

router.use(bodyParser.urlencoded({
    extended: true
}));

router.get('/', authCheck.isLoggedin, (req, res) => {
    res.render('home');
});

router.get('/dashboard', [authCheck.mustLogin], (req, res) => {
    let jwt = req.body.decodedJWT;
    let data = {
        user: jwt.profile,
        timeList: DateUtil.halfHourIntervals(),
        profile: null,
        calendars: null,
    };
    console.log("DATA IN THE ROUTE FUNCTION", data);
    
    habiticaController.getProfile(jwt.habiticaID)
        .then(profile => data.profile = profile)
        .catch(err => {
            // API key not set up or something
            console.log("Habitica Profile error", err);
        })
        .finally(() => {
            console.log("getting gcal")
            calendarController.listCal(jwt.sub)
                .then(calendars => data.calendars = calendars)
                .catch(err => {
                    // Calendar CMI
                    console.log("Calendar error", err);
                })
                .finally(() => res.render("dashboard", data))
        })
});

module.exports = router;