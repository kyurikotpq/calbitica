const router = require('express').Router();
const habiticaController = require('../../controllers/h-controller');
const apiCheck = require('../../middleware/api-check');
const JWTUtil = require('../../util/jwt');

/**
 * Save a user's Habitica User ID
 * & API Key to MongoDB
 */
router.post('/habitica', apiCheck, (req, res) => {
    let decodedJWT = req.body.decodedJWT;
    
    habiticaController.saveSettings(req.body)
        .then(user => {
            if(user._id.toString() == decodedJWT.sub) {
                let data = {
                    access_token: decodedJWT.access_token,
                    refresh_token: decodedJWT.access_token,
                    profile: decodedJWT.profile,
                    habiticaID: user.habiticaID,
                    habiticaAPI: user.habiticaAPI,
                };

                // resign the JWT
                let jwt = JWTUtil.signCalbiticaJWT(data, decodedJWT.sub);

                if(req.session.user) // call is from MVC!
                    req.session.user = jwt;
                
                res.status(200).json({ 
                    jwt,
                    message: "Habitica settings saved successfully" 
                });
            } else 
                res.status(400).json({ message: "Could not save Habitica settings" });
        }).catch(err => {
            res.status(400).json({ message: "Could not save Habitica settings" });
        });

});

module.exports = router;