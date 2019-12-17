const router = require('express').Router();
const habitica = require('../../controllers/habitica');
const apiCheck = require('../../middleware/api-check');

const allowedTypes = ["habits", "dailys", "todos", "rewards", "completedTodos"];

/**
 * Import a user's tasks from 
 * Habitica as Calbits
 */
router.get('/sync', apiCheck, (req, res) => {
    let type = req.params.type;
    if (!allowedTypes.includes(type))
        type = null;

    habitica.importToMongo(type, req.body.userID)
        .then(result => {
            // return a success message
            res.status(200).json(result);
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ message: "Could not import Habitica items into Calbitica" });
        });
});

router.get('/profile', apiCheck, (req, res) => {
    habitica.getProfile(req.body.habiticaID)
        .then(result => {
            let profile = result.data; // this is the axios object
            let status = (profile.success) ? 200 : 400;
            let data = (profile.success) ? profile.data
                : { message: "Could not get Habitica profile" };

            res.status(status).json(data);
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ message: "Could not get Habitica profile" });
        });
})
module.exports = router;