/**
 * Middleware to check if the API call is 
 * internal (ExpressJS MVC) or external (API call 
 * from elsewhere i.e. the mobile apps)
 * 
 * and regardless of the type of call, 
 * if it's a valid API key, allow access!
 */

const User = require('../models/user-model').model;
const axiosInstance = require('../config/h-axios-setup');
const oauth2Client = require('../config/google-setup');
const Crypt = require('../util/crypt');

/**
 * Is the Calbitica API key provided valid?
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const isValidAPIKey = (req, res, next) => {
    let calbitAPI = null;
    let internal = req.session.calbitAPI;
    let external = req.header("Authorization");

    if (internal) {
        // if internal-provided token exists, try to retrieve the API token
        calbitAPI = internal;
    } else if (external) {
        external = external.replace("Bearer ", '');
        calbitAPI = external;
    }

    User.find({
        calbitAPI: {
            $elemMatch: {
                key: calbitAPI
            }
        }
    }).then(results => {
        if (!calbitAPI || results.length != 1) {
            next({ status: 401, message: "Invalid user" });
        }

        let user = results[0];

        if (user.habiticaAPI && user.habiticaID) {
            let plainHabiticaAPI = Crypt.decrypt(user.habiticaAPI);

            // QOTD: Will this affect when I have multiple users using the app?
            axiosInstance.defaults.headers.common['x-api-key'] = plainHabiticaAPI;
            axiosInstance.defaults.headers.common['x-api-user'] = user.habiticaID;

            req.body.habiticaAPI = user.habiticaAPI;
            req.body.habiticaID = user.habiticaID;

            // more for when API call is made from the MVC side
            if (internal) {
                oauth2Client.setCredentials({
                    access_token: Crypt.decrypt(req.session.access_token),
                    refresh_token: Crypt.decrypt(req.session.refresh_token)
                });

                req.session.habiticaAPI = user.habiticaAPI;
                req.session.habiticaID = user.habiticaID;
            }
        }
        req.body.userID = user._id;
        next();

    }).catch(err => {
        console.log(err);
        next({ status: 500, message: err })
    })

}

module.exports = isValidAPIKey;