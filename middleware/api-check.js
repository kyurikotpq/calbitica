/**
 * Middleware to check if the API call is 
 * internal (ExpressJS MVC) or external (API call 
 * from elsewhere i.e. the mobile apps)
 * 
 * and regardless of the type of call, 
 * if it's a valid API key, allow access!
 */

const User = require('../models/user').model;

/**
 * Is the API key provided valid?
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
        calbitAPI = external
    }

    User.find({ calbitAPI }).then(results => {
        if (!calbitAPI || results.length != 1) {
            res.status(401).json({ message: "Invalid user" });
            return;
        }

        req.body.calbitAPI = calbitAPI;
        next();
    }).catch(err => {
        console.log(err);
        return;
    })

}

module.exports = isExternal;