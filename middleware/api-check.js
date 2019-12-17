/**
 * Middleware to check if the API call is 
 * internal (ExpressJS MVC) or external (API call 
 * from elsewhere i.e. the mobile apps)
 * 
 * and regardless of the type of call, 
 * if it's a valid API key, allow access!
 */

const User = require('../models/user').model;
const axiosInstance = require('../config/h-axios-setup');
const crypt = require('../util/crypt');

/**
 * Is the Calbitica API key provided valid?
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const isExternal = (req, res, next) => {
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

    User.find({ calbitAPI }).then(results => {
        if (!calbitAPI || results.length != 1) {
            next({ status: 401, message: "Invalid user" });
        }

        let user = results[0];

        if (user.habiticaAPI && user.habiticaID) {
            let plainHabiticaAPI = crypt.decrypt(user.habiticaAPI);

            // QOTD: Will this affect when I have multiple users using the app?
            axiosInstance.defaults.headers.common['x-api-key'] = plainHabiticaAPI;
            axiosInstance.defaults.headers.common['x-api-user'] = user.habiticaID;
            
            req.body.habiticaID = user.habiticaID;
            req.body.userID = user._id;
            req.body.calbitAPI = calbitAPI;

            next();
        } else
            next({ status: 401, message: "Please enter your Habitica API Key to continue" });

    }).catch(err => {
        console.log(err);
        next({ status: 500, message: err })
    })

}

module.exports = isExternal;