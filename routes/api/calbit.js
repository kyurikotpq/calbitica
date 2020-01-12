/**
 * Routes for the CRUD of Calbits
 */
const router = require('express').Router();
const apiCheck = require('../../middleware/api-check');
const habiticaCheck = require('../../middleware/h-check');
const calbitController = require('../../controllers/calbit-controller');
const gcalImporter = require('../../controllers/gcal-import');
const habiticaController = require('../../controllers/h-controller');

/**
 * [GET] Get all Calbits belonging to the user
 * @query {isDump} Boolean (true/false/all)
 */
router.get('/', apiCheck, function (req, res) {
    let userID = req.body.decodedJWT.sub;
    let firstDate = !req.body.start ? new Date() : req.body.start;
    let lastDate = !req.body.end ? null : req.body.end;
    let fullSync = !req.query.fullSync ? true : req.query.fullSync;

    // CONSIDER: putting the google import and habitica import here 
    // so one less API call from client to our Calbitica API
    gcalImporter(userID, fullSync, firstDate, lastDate)
        .then(result => {
            console.log("SHOULD HAVE IMPORTED", result)
            calbitController.getAllCalbits(userID, req.query.isDump, true)
                .then((events) => {
                    res.status(200).json(events);
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({ message: err });
                });
        })
        .catch(err => {
            console.log('import error', err);
            res.status(err.status).json({ message: err.message });
        });

});

/**
 * [POST] Save a Calbit to Habitica and then to MongoDB
 */
router.post('/', [apiCheck, habiticaCheck], function (req, res) {
    let data = req.body,
        decodedJWT = data.decodedJWT;

    delete data.decodedJWT;

    habiticaController.saveToHabitica({
        text: data.title,
        type: 'todo' // add support for habits & dailies in future
    }).then((axiosResponse) => {
        let hResponse = axiosResponse.data;
        if (hResponse.success) {
            data.habiticaID = hResponse.data.id;
            calbitController.createCalbit(data, decodedJWT.sub, 'mvc')
                .then(resultCode => {
                    res.status(200).json({ message: `Event ${data.title} created.` });
                })
                .catch(err => {
                    res.status(500).json({ message: err });
                })
        }
    }).catch(err => {
        console.log(err)
    })
});


/**
 * [PUT] Update the completion status of the
 * specified Calbit
 */
router.put('/:id/complete', [apiCheck, habiticaCheck], (req, res) => {
    let id = req.params.id;
    let status = !req.body.status ? false : req.body.status == 'true';
    let complete = (status) ? "completed" : "incomplete";

    calbitController.updateCompletion(id, status)
        .then((result) => {
            res.status(200).json({
                message: `${result.summary} is now ${complete}`,
                stats: result.stats
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: `Unable to ${complete} the event` });
        });
})

/**
 * [PUT] Update the specified Calbit
 * @param {id} String
 */
router.put('/:id', [apiCheck, habiticaCheck], function (req, res) {
    let id = req.params.id;
    let data = req.body;
    calbitController.updateCalbit(id, data, 'mvc')
        .then((resultCode) => {
            console.log(resultCode);
            res.status(200).json({ message: "Event updated." });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Unable to update the event" });
        });
});

/**
 * [DELETE] Delete the specified Calbit
 */
router.delete('/:id', [apiCheck, habiticaCheck], function (req, res) {
    let id = req.params.id;
    calbitController.deleteInMongo(id, true)
        .then((event) => {
            res.status(200).json({ message: `Event ${event.summary} deleted.` });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Unable to delete event" });
        })
});

module.exports = router;