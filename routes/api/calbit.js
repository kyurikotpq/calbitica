/**
 * Routes for the CRUD of Calbits
 */
const router = require('express').Router();
const apiCheck = require('../../middleware/api-check');
const habiticaCheck = require('../../middleware/h-check');
const CalbitController = require('../../controllers/calbit-controller');
const GCalImporter = require('../../controllers/gcal-import');
const HabiticaController = require('../../controllers/h-controller');

const CalbitQueueUtil = require("../../util/queue");

/**
 * @api {get} /calbit Get all Calbits
 * @apiGroup Calbit
 * @apiDescription Get all Calbits belonging to the user. Alternatively, get a filtered list 
 * as specified through query parameters.
 * 
 * @apiParam (QueryParam) {String="all","true","false"} [isDump=false] Whether to get only "dumped" Calbits 
 * (<code>isDump: true</code>), non-dump Calbits, or both dump & non-dump Calbit. 
 * <br><br><strong>This param has no effect on the results returned for now.</strong>
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
    let fullSync = !req.query.fullSync ? false : req.query.fullSync + "";

    let searchCriteria = [];
    let start = new Date(req.query.start),
        end = new Date(req.query.end);

    if (!isNaN(start.getTime())) {
        let startCriteria = { $lte: end };
        searchCriteria.push({
            $or: [
                { "start.dateTime": startCriteria },
                { "start.date": startCriteria },
            ]
        });
    }
    if (!isNaN(end.getTime())) {
        let endCriteria = { $gte: start };
        searchCriteria.push({
            $or: [
                { "end.dateTime": endCriteria },
                { "end.date": endCriteria },
            ]
        });
    }

    new Promise((resolve, reject) => {
        if (`${fullSync}` == "true") {
            CalbitQueueUtil.push(
                new GCalImporter(
                    res.locals.googleOAuth2Client,
                    res.locals.axiosInstance
                ).importCalbits(userID, fullSync)
            );
            CalbitQueueUtil.process();
        }
        // } else 
        resolve(true)
    })
        .then(() => {
            new CalbitController(res.locals.googleOAuth2Client, res.locals.axiosInstance)
                .getAllCalbits(
                    userID, req.query.isDump,
                    true, searchCriteria
                )
                .then((events) => {
                    res.status(200).json(events);
                })
                .catch(err => {
                    res.status(500).json({ message: err });
                });
        })
        .catch(err => {
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

    new HabiticaController(res.locals.axiosInstance)
        .saveToHabitica({
            text: data.title,
            type: 'todo' // add support for habits & dailies in future
        }).then((axiosResponse) => {
            let hResponse = axiosResponse.data;
            if (hResponse.success) {
                data.habiticaID = hResponse.data.id;

                new CalbitController(res.locals.googleOAuth2Client, res.locals.axiosInstance)
                    .createCalbit(data, decodedJWT.sub, 'mvc')
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
    let complete = (status) ? "complete" : "incomplete";

    let controller = new CalbitController(res.locals.googleOAuth2Client, res.locals.axiosInstance);
    if (CalbitQueueUtil.isProcessing()) {
        CalbitQueueUtil.push(controller.updateCompletion(id, status));
        CalbitQueueUtil.process();

        res.status(200).json({
            message: `Marked as ${complete}`
        });
    } else {
        controller.updateCompletion(id, status)
            .then((result) => {
                res.status(200).json({
                    message: `Marked as ${complete}`,
                    stats: result.stats
                });
            })
            .catch(err => {
                res.status(500).json({ message: `Unable to ${complete} the event` });
            });
    }
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

    CalbitQueueUtil.push(
        new CalbitController(res.locals.googleOAuth2Client, res.locals.axiosInstance)
            .updateCalbit(id, data, 'mvc')
    );
    CalbitQueueUtil.process();

    res.status(200).json({ message: "Event updated." });
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

    CalbitQueueUtil.push(
        new CalbitController(res.locals.googleOAuth2Client, res.locals.axiosInstance)
            .deleteInMongo(id, true)
    );
    CalbitQueueUtil.process();
    res.status(200).json({ message: `Event deleted.` });
});

module.exports = router;