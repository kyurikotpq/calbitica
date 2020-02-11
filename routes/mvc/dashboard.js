const bodyParser = require('body-parser');
const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
const DateUtil = require('../../util/date');
const HabiticaController = require('../../controllers/h-controller');
const CalendarController = require('../../controllers/calendar-controller');

router.use(bodyParser.urlencoded({
    extended: true
}));

router.get('/', authCheck.isLoggedin, (req, res) => {
    res.render('home');
});

router.get('/dashboard', [authCheck.mustLogin], (req, res) => {
    let decodedJWT = req.body.decodedJWT;
    let data = {
        user: decodedJWT.profile,
        profile: null,
        calendars: null,
    };
    
    new HabiticaController(res.locals.axiosInstance)
        .getProfile(decodedJWT.habiticaID)
        .then(profile => data.profile = profile)
        .catch(err => {
            // API key not set up or something
            // it's alright - just continue :)
        })
        .finally(() => {
            new CalendarController(res.locals.googleOAuth2Client)
                .listCal(decodedJWT.sub)
                .then(calendars => data.calendars = calendars)
                .catch(err => {
                    // Calendar CMI
                    if(err.status != undefined && err.status == 401) {
                        req.session = null;
                        res.redirect("/calbitica/auth/login");
                    }
                })
                .finally(() => res.render("dashboard", data))
        })
});

module.exports = router;