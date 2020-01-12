const router = require('express').Router();
const habiticaController = require('../../controllers/h-controller');
const hImporter = require('../../controllers/h-import');

const apiCheck = require('../../middleware/api-check');
const habiticaCheck = require('../../middleware/h-check');

const allowedTypes = ["habits", "dailys", "todos", "rewards", "completedTodos"];

/**
 * [GET] Import a user's tasks from 
 * Habitica as Calbits into MongoDB
 */
router.get('/sync', [apiCheck, habiticaCheck], (req, res) => {
    let type = req.params.type;
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

/**
 * [GET] Get a user's Profile (displayName, stats, etc.)
 * from Habitica
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
 * [POST] Accept/Decline a Quest invitation
 */
router.post('/quest', [apiCheck, habiticaCheck], (req, res) => {
    let acceptQuest = req.body.accept == 'true',
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
 * [GET] Rest in the Tavern
 */
router.get('/sleep', [apiCheck, habiticaCheck], (req, res) => {
    habiticaController.toggleSleep()
        .then(result => res.status(200).json(result))
        .catch(err => {
            res.status(err.status).json({ message: err.message });
        })
})

module.exports = router;