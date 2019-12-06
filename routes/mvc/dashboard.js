const bodyParser = require('body-parser');
const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
const gcal = require('../../controllers/gcal');

var db = require('./calendarEvents.js');
db.connect();

router.use(bodyParser.urlencoded({
    extended: true
}));

router.get('/', authCheck.isLoggedin, (req, res) => {
    res.render('home');
});

router.get('/dashboard', authCheck.mustLogin, (req, res) => {
    // gcal.calList().then((list) => {
    //     // console.log(list);
    //     res.send(list);
    // }).catch((rej) => {
    //     console.log('whoops, gcal didnt go thru')
    //     res.send(rej);
    // });

    // sync.loginSync(req.user)
    //     .then((res) => {
    //         res.render('dashboard', { user: req.user });
    //     })
    res.render("dashboard", { user: req.session.user });
});

// Calendar Get All Events
router.get('/getEvents', function (req, res) {
    db.getAllEvents(function (err, events) {
        res.send(events);
    });
});

// Calendar Save Event
router.post('/saveEvent', function (req, res) {
    var data = req.body;

    db.saveEvent(data.title, data.start, data.end, function (err, event) {
        if (err) {
            res.status(500).send("Unable to add a new event");
        } else {
            res.status(200).send(event);
        }
    });
});

router.get('/calList', (req, res) => {
    // gcal.calList().then((list) => {
    //     console.log(list);
    //     res(list);
    // }).catch((rej) => {

    // });
})

module.exports = router;