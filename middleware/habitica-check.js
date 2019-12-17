/**
 * Middleware to check if the user has entered 
 * their Habitica User ID and API key
 */
const User = require('../models/user').model;
const axiosInstance = require('../config/h-axios-setup');
const crypt = require('../util/crypt');

/**
 * Has the user entered their
 * Habitica User ID and API Key?
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 */
const hasAPIKey = (req, res, next) => {
    // Retrieve the Calbitica API Key
    const calbitAPI = req.body.calbitAPI;
    if (!calbitAPI) {
        res.status(401).json({ message: "Invalid user" });
        return;
    }

    // See if there is Habitica User ID 
    // and API Key saved in MongoDB
    User.find({ calbitAPI }).then(results => {
        if (results.length == 1) {
            let user = results[0];
            
            if (user.habiticaAPI && user.habiticaID) {
                let plainHabiticaAPI = crypt.decrypt(user.habiticaAPI);

                // QOTD: Will this affect when I have multiple users using the app?
                axiosInstance.defaults.headers.common['x-api-key'] = plainHabiticaAPI;
                axiosInstance.defaults.headers.common['x-api-user'] = user.habiticaID;

                req.body.habiticaID = user.habiticaID;
                req.body.userID = user._id;
                next();
            } else
                next({ status: 401, message: "Please enter your Habitica API Key to continue" });

        } else
            next({ status: 401, message: "Invalid user" });
    }).catch(err => {
        next({ status: 500, message: err });
    })
}

module.exports = hasAPIKey;