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
 * @api {get} /calbit Get all Calbits
 * @apiGroup Calbit
 * @apiDescription Get all Calbits belonging to the user. Alternatively, get a filtered list 
 * as specified through query parameters.
 * 
 * @apiParam (QueryParam) {String="all","true","false"} [isDump=false] Whether to get only "dumped" Calbits 
 * (<code>isDump: true</code>), non-dump Calbits, or both dump & non-dump Calbit.
 * @apiParam (QueryParam) {Boolean} [fullSync=true] Whether to do an incremental sync with Google Calendar.
 * @apiParam (QueryParam) {Date} [start=today] Select Calbits that happen on or after this date.
 * @apiParam (QueryParam) {Date} [end=null] Select Calbits that happen on or before this date.
 * 
 * @apiSuccess {Array} data The list of Calbits. For a full list of each Calbit's fields, see 
 * <code>calbit-controller.js</code>
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": [Calbit]
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
 */
router.get('/', apiCheck, function (req, res) {
    let userID = req.body.decodedJWT.sub;
    let fullSync = !req.query.fullSync ? true : req.query.fullSync + "";

    // CONSIDER: putting the google import and habitica import here 
    // so one less API call from client to our Calbitica API
    gcalImporter(userID, fullSync)
        .then(result => {
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
 * @api {post} /calbit Create a Calbit
 * @apiGroup Calbit
 * @apiDescription Creates a Calbit in Habitica, Google Calendar, and Calbitica's database.
 * 
 * @apiParam (BodyParam) {String} title The name of the Calbit
 * @apiParam (BodyParam) {String} calendarID The Google ID of the Calendar
 * @apiParam (BodyParam) {Date|DateTime} start The start date in the ISO format, 
 * i.e. <code>YYYY-MM-DDTHH:mm:ssZ</code>. All dates are assumed to be in UTC timezone.
 * @apiParam (BodyParam) {Date|DateTime} end The end date in the ISO format, 
 * i.e. <code>YYYY-MM-DDTHH:mm:ssZ</code>. All dates are assumed to be in UTC timezone.
 * @apiParam (BodyParam) {Boolean} allDay Whether it'll be added as an all-day event in Google Calendar.
 * @apiParam (BodyParam) {Boolean} isDump Whether it's a dumped Calbit.
 * @apiParam (BodyParam) {Boolean} display Whether the Calbit will be included in GetCalbit results.
 * This should be the same as the Calendar's <code>sync</code> state.
 * @apiParam (BodyParam) {String} [description] Description of the Calbit
 * @apiParam (BodyParam) {String} [location] Location of the Calbit
 * 
 * @apiSuccess {String} message Success message confirming the creation of the Calbit
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *         "message": "Event :title created"
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
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
        res.status(400).json({ message: err });
    })
});

/**
 * @api {put} /calbit/:id/complete Update Calbit's completion status
 * @apiGroup Calbit
 * @apiDescription Update the completion status of the specified Calbit
 * 
 * @apiParam (PathParam) {String} id MongoDB ObjectID
 * 
 * @apiParam (BodyParam) {Boolean} status Completion status of the Calbit
 * 
 * @apiSuccess {String} message Success message confirming the completion of the Calbit
 * @apiSuccess {Object} stats The user's new stats (HP, MP, XP, etc.) as returned from Habitica
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *         "message": ":title is now complete/incomplete",
 *         "stats": { TODO }
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
 */
router.put('/:id/complete', [apiCheck, habiticaCheck], (req, res) => {
    let id = req.params.id;
    let status = !req.body.status ? false : (req.body.status + "") == "true";
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
 * @api {put} /calbit/:id Update a Calbit
 * @apiGroup Calbit
 * @apiDescription Updates a Calbit in Habitica, Google Calendar, and Calbitica's database.
 * 
 * @apiParam (PathParam) {String} id MongoDB ObjectID
 * 
 * @apiParam (BodyParam) {String} title The name of the Calbit
 * @apiParam (BodyParam) {String} calendarID The Google ID of the Calendar
 * @apiParam (BodyParam) {String} googleID The Google ID of the Calendar <strong>Event</strong>
 * @apiParam (BodyParam) {Date|DateTime} start The start date in the ISO format, 
 * i.e. <code>YYYY-MM-DDTHH:mm:ssZ</code>. All dates are assumed to be in UTC timezone.
 * @apiParam (BodyParam) {Date|DateTime} end The end date in the ISO format, 
 * i.e. <code>YYYY-MM-DDTHH:mm:ssZ</code>. All dates are assumed to be in UTC timezone.
 * @apiParam (BodyParam) {Boolean} allDay Whether it'll be added as an all-day event in Google Calendar.
 * @apiParam (BodyParam) {Boolean} [isDump] Whether it's a dumped Calbit.
 * @apiParam (BodyParam) {Boolean} [display] Whether the Calbit will be included in GetCalbit results.
 * This should be the same as the Calendar's <code>sync</code> state.
 * @apiParam (BodyParam) {String} [description] Description of the Calbit
 * @apiParam (BodyParam) {String} [location] Location of the Calbit
 * 
 * @apiSuccess {String} message Success message confirming the update of the Calbit
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *         "message": "Event updated"
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
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
 * @api {delete} /calbit/:id Delete a Calbit
 * @apiGroup Calbit
 * @apiDescription Delete the specified Calbit from Habitica, Google Calendar, and Calbitica's database
 * 
 * @apiParam (PathParam) {String} id MongoDB ObjectID
 * 
 * @apiSuccess {String} message Success message confirming the deletion of the Calbit
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *         "message": "Event :title deleted."
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
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