/**
 * Routes for keeping track of GCal-related operations
 */
const router = require('express').Router();
const calendarController = require('../../controllers/calendar-controller');
const gcalImporter = require('../../controllers/gcal-import');
const apiCheck = require('../../middleware/api-check');

/**
 * @api {get} /cal Get all Calendars
 * @apiGroup Calendar
 * @apiDescription Gets all of the user's calendars from Calbitica's database 
 * - including non-synced calendars 
 * 
 * @apiSuccess {String} Calendar[] A list of Calendars. TODO: Restrict fields returned
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": [Calendar]
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
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
 * @api {get} /cal/import Import Events as Calbits
 * @apiGroup Calendar
 * @apiDescription Import user's GCal events (belonging to synced calendars only)
 * to Calbitica's database as Calbits. 
 * 
 * @apiParam (QueryParam) {Boolean} [fullSync=true] Whether to do an incremental sync with Google Calendar
 * @apiParam (QueryParam) {Date} [start=today] Import Google Calendar Events that happen on or after this date.
 * @apiParam (QueryParam) {Date} [end=null] Import Google Calendar Events that happen on or before this date.
 * 
 * @apiSuccess {String} [Object] A summary of how many events were updated, created, and deleted
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *          "success": { updates: Number, deletes: Number, creates: Number },
 *          "failure": { updates: Number, deletes: Number, creates: Number }
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
 */
router.get('/import', apiCheck, (req, res) => {
    let firstDate = !req.query.firstDate ? new Date() : req.query.firstDate;
    let lastDate = !req.query.lastDate ? null : req.query.lastDate;
    let fullSync = !req.query.fullSync ? true : req.query.fullSync;

    let decodedJWT = req.body.decodedJWT;
    gcalImporter(decodedJWT.sub, fullSync, firstDate, lastDate)
        .then(result => {
            res.status(200).json(result);
        })
        .catch(err => {
            console.log('import error', err);
            res.status(err.status).json({ message: err.message });
        });
});

/**
 * @api {get} /cal/sync/:id Update Calendar's sync status
 * @apiGroup Calendar
 * @apiDescription Change the 'sync' property of the specified calendar. Affects whether:
 * - the Calendar's events will be included during Google Calendar imports,
 * - the Calendar's Calbits will be displayed (included) when getting all Calbits
 *  
 * @apiParam (PathParam) {String} [id] MongoDB ObjectID of the Calendar
 * 
 * @apiParam (QueryParam) {Boolean} [sync] Whether the Calendar should be synced
 * 
 * @apiSuccess {String} message A success message confirming the sync status of the Calendar
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *          "message": "TODO"
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
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
            console.log(err);
            res.status(err.status).json({ message: err.message });
        });
});

module.exports = router;