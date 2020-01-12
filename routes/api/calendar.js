/**
 * Routes for keeping track of GCal-related operations
 */
const router = require('express').Router();
const calendarController = require('../../controllers/calendar-controller');
const gcalImporter = require('../../controllers/gcal-import');
const apiCheck = require('../../middleware/api-check');

/**
 * [GET] Get all of the user's GCals from MongoDB
 * includes non-synced calendars
 * 
 */
router.get('/', apiCheck, (req, res) => {
    let decodedJWT = req.body.decodedJWT;
    calendarController.listCal(decodedJWT.sub)
        .then(calendars => {
            res.status(200).json(calendars);
        })
        .catch(err => {
            res.status(err.status).json({ message: err.message });
        });
});

/**
 * [GET] Import user's GCal events (synced calendars)
 * to MongoDB as Calbits + update the nextSyncToken of 
 * the calendar in MongoDB
 */
router.get('/import', apiCheck, (req, res) => {
    let firstDate = !req.body.firstDate ? new Date() : req.body.firstDate;
    let lastDate = !req.body.lastDate ? null : req.body.lastDate;
    let fullSync = !req.query.fullSync ? true : req.query.fullSync;

    let decodedJWT = req.body.decodedJWT;
    gcalImporter(decodedJWT.sub, fullSync, firstDate, lastDate)
        .then(result => {
            res.status(200).json(result);
        })
        .catch(err => {
            res.status(err.status).json({ message: err.message });
        });
});

/**
 * [GET] Change the 'sync' property of the specified calendar
 * if (sync) it will be included when calling [GET] /import
 * else it will NOT be included when calling [GET] /import
 */
router.get('/sync/:id', apiCheck, (req, res) => {
    let id = req.params.id,
        reqSync = req.query.sync,
        sync = (!reqSync) ? false : reqSync;

    calendarController.changeSync(id, sync)
        .then(message => {
            res.status(200).json({ message });
        })
        .catch(err => {
            res.status(err.status).json({ message: err.message });
        });
});

module.exports = router;