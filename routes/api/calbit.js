const router = require('express').Router();
const apiCheck = require('../../middleware/api-check');
const db = require('../../controllers/calbit');
const habitica = require('../../controllers/habitica');

// Calendar Get All Events
router.get('/', apiCheck, function (req, res) {
    db.getAllEvents()
        .then((events) => {
            res.status(200).send(events);
        })
        .catch(err => {
            console.log(err);
            res.status(500).send(err);
        });
});

// Calendar Save Event
router.post('/', apiCheck, function (req, res) {
    let data = req.body;

    habitica.saveToHabitica({
        text: data.title,
        type: 'todo'
    }).then((response) => {
        console.log(data)
        db.saveEvent(data)
            .then(event => {
                res.status(200).send(event);
            })
            .catch(err => {
                res.status(500).send("Unable to add a new event");

            })
    }).catch(err => {
        console.log(err)

    })
});

// Calendar Update Event by _id
router.put('/:id', apiCheck, function (req, res) {
    var id = req.params.id;
    var data = req.body;
    db.updateEventById(id, data)
        .then((events) => {
            if (events.n == 0) {
                res.status(200).send("No events were updated");
            } else {
                res.status(200).send("Events successfully updated");
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Unable to update the events");
        });
});

// Calendar Delete Event by _id
router.delete('/:id', apiCheck, function (req, res) {
    var id = req.params.id;
    db.deleteEventById(id)
        .then((event) => {
            if (event.n == 0) {
                res.status(200).send("No event were deleted");
            } else {
                res.status(200).send("Event from " + id + " have been successfully deleted.");
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Unable to delete event");
        })
});

module.exports = router;