const router = require('express').Router();
const habiticaController = require('../../controllers/h-controller');
const apiCheck = require('../../middleware/api-check');
const JWTUtil = require('../../util/jwt');

/**
 * @api {post} /settings/habitica Save Habitica Settings
 * @apiGroup Settings
 * @apiDescription Saves the user's Habitica API Key and/or User ID into the database.
 * The database field will only be updated if a non-empty value is passed.<br><br>
 * <strong>Store the new JSON Web Token (JWT)</strong> returned by this endpoint.
 * 
 * @apiParam (BodyParam) {String} [apiKey] User's Habitica API Key
 * @apiParam (BodyParam) {String} [hUserID] User's Habitica UserID
 * 
 * @apiSuccess {String} message Success message confirming the deletion of the Calbit
 * @apiSuccess {String} jwt JWT for access to the rest of the Calbitica API
 * @apiSuccessExample Success Response:
 *     200 OK
 *     {
 *       "message": "Successfully signed in to Calbitica.",
 *       "jwt": "xxx.xxx.xxx"
 *     }
 * 
 * @apiError ParseError Happens when jwt is malformed/invalid
 * @apiErrorExample Error Response:
 *     400 Bad Request
 *     {
 *       "message": "jwt malformed"
 *     }
 * @apiError DatabaseError Happens when input is malformed
 * @apiErrorExample Error Response:
 *     400 Bad Request
 *     {
 *       "data": {
 *         "message": "Could not save Habitica settings"
 *       }
 *     }
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

                if(req.session != undefined) // call is from MVC!
                    req.session.user = jwt;
                
                res.status(200).json({ 
                    jwt,
                    message: "Habitica settings saved successfully" 
                });
            } else 
                res.status(400).json({ message: "Could not save Habitica settings" });
        }).catch(err => {
            console.log(err);
            res.status(400).json({ message: "Could not save Habitica settings" });
        });

});

module.exports = router;