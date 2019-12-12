const router = require('express').Router();
const habitica = require('../../controllers/habitica');
const apiCheck = require('../../middleware/api-check');

/**
 * Save a user's Habitica User ID
 * & API Key to MongoDB
 */
router.post('/habitica', apiCheck, (req, res) => {
    habitica.saveSettings(req.body)
        .then(result => {
            if(result.calbitAPI) {
                // modify the data in the session
                if(result.habiticaAPI) req.session.habiticaAPI = result.habiticaAPI;
                if(result.habiticaID) req.session.habiticaID = result.habiticaID;

                res.status(200).json({ message: "Habitica settings saved successfully" });
            } else 
                res.status(400).json({ message: "Could not save Habitica settings" });
        }).catch(err => {
            console.log(err);
            res.status(400).json({ message: "Could not save Habitica settings" });
        });

});

module.exports = router;