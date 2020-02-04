const router = require('express').Router();
const habiticaController = require('../../controllers/h-controller');
const hImporter = require('../../controllers/h-import');

const apiCheck = require('../../middleware/api-check');
const habiticaCheck = require('../../middleware/h-check');

const allowedTypes = ["habits", "dailys", "todos", "rewards", "completedTodos"];

/**
 * @api {get} /h/sync Import Habitica Tasks
 * @apiGroup Habitica
 * @apiDescription <strong>THIS ROUTE IS NOT IN USE. REQUESTING THIS ROUTE WILL RESULT IN 404</strong>
 * <br><br>
 * Import a user's tasks from Habitica as "dumped" Calbits.
 * Google Calendar events will not be created until the user assigns
 * the Calbit to a specific date-time.
 *  
 * @apiParam (QueryParam) {String="habits","dailys","todos","rewards","completedTodos"} [type] The type of Habitica tasks to import
 * @apiSuccess {String} TODO TODO
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *          TODO
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
 */
/*
router.get('/sync', [apiCheck, habiticaCheck], (req, res) => {
    let type = req.query.type;
    if (!allowedTypes.includes(type))
        type = null;

    let decodedJWT = req.body.decodedJWT;
    hImporter(type, decodedJWT.sub)
        .then(result => {
            // return a success message
            res.status(200).json(result);
        })
        .catch(err => {
            res.status(err.status).json({ message: err.message });
        });
});
*/

/**
 * @api {get} /h/profile Get Habitica Profile
 * @apiGroup Habitica
 * @apiDescription Get a user's Habitica Profile. Includes stats and party information.
 *  
 * @apiSuccess {String} TODO TODO
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *          TODO
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
 */
router.get('/profile', [apiCheck, habiticaCheck], (req, res) => {
    let decodedJWT = req.body.decodedJWT;
    habiticaController.getProfile(decodedJWT.habiticaID)
        .then(profile => {
            res.status(200).json(profile);
        })
        .catch(err => {
            res.status(err.status).json({ message: err.message });
        });
});

/**
 * @api {post} /h/quest Accept/Decline a Quest invitation
 * @apiGroup Habitica
 * @apiDescription Accept or Decline the current quest invitation.
 * 
 * @apiParam (BodyParam) {Boolean} accept Whether to accept or decline the quest invitation
 * @apiParam (BodyParam) {String} groupID User's Party ID
 * 
 * @apiSuccess {String} TODO TODO
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *          TODO
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
 */
router.post('/quest', [apiCheck, habiticaCheck], (req, res) => {
    let acceptQuest = (req.body.accept + "") == "true",
        groupID = req.body.groupID;

    habiticaController.respondToQuest(acceptQuest, groupID)
        .then(quest => {
            res.status(200).json(quest);
        })
        .catch(err => {
            res.status(err.status).json({ message: err.message });
        })
});

/**
 * @api {get} /h/sleep Toggle Sleep Status
 * @apiGroup Habitica
 * @apiDescription Toggles the user's sleep status in Habitica.
 * - <strong>Sleep/Rested in Tavern/Checked into Tavern</strong> - Damage from Dailies is paused<br>
 * - <strong>Not asleep/Left the Tavern</strong> - Damage from Dailies is resumed
 * 
 * @apiSuccess {String} message Success message confirming the update of the user's sleep status
 * @apiSuccess {Boolean} sleep Whether the user is asleep
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "data": {
 *         "message": "You're resting in the Inn. Damage is paused.",
 *         "sleep": true
 *       }
 *     }
 * 
 * @apiError SomeError TODO
 * @apiErrorExample Error Response:
 *     WILL BE DOCUMENTED SOON
 */
router.get('/sleep', [apiCheck, habiticaCheck], (req, res) => {
    habiticaController.toggleSleep()
        .then(result => res.status(200).json(result))
        .catch(err => {
            res.status(err.status).json({ message: err.message });
        })
})

module.exports = router;