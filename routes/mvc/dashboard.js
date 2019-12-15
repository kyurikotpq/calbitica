const bodyParser = require('body-parser');
const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
const gcal = require('../../controllers/gcal');

var db = require('./calendar-events.js');
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

    db.saveEvent(data.title, data.start, data.end, data.color, function (err, event) {
        if (err) {
            res.status(500).send("Unable to add a new event");
        } else {
            res.status(200).send(event);
        }
    });
});

// Calendar Update Event by _id
router.post('/updateEvent/:id', function (req, res) {
    var id = req.params.id;
    var data = req.body;
    db.updateEventById(id , data.title, data.start, data.end, data.color, function (err, events) {
        if (err) {
            res.status(500).send("Unable to update the events");
        } else {
            if (events.n == 0) {
                res.status(200).send("No events were updated");
            } else {
                res.status(200).send("Events successfully updated");
            }
        }
    });
});

// Calendar Delete Event by _id
router.delete('/deleteEvent/:id', function (req, res) {
    var id = req.params.id;
    db.deleteEventById(id, function (err, event) {
        if (err) {
            res.status(500).send("Unable to delete event");
        } else {
            if (event.n == 0) {
                res.status(200).send("No event were deleted");
            } else {
                res.status(200).send("Event from "+ id + " have been successfully deleted.");
            }
        }
    })
});

router.get('/calList', (req, res) => {
    // gcal.calList().then((list) => {
    //     console.log(list);
    //     res(list);
    // }).catch((rej) => {

    // });
})

module.exports = router;