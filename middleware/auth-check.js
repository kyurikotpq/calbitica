/**
 * Middleware to check if user is logged in...
 * to the MVC!
 */
const JWTUtil = require('../util/jwt');
let authController = require('../controllers/auth-controller');

/**
 * Is the user logged in? No -> Redirect to login page
 * Else verify the JWT
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const authCheckMustLogin = (req, res, next) => {
    if (req.session == undefined || req.session.user == undefined) {
        req.session = null;
        res.redirect('/auth/login');
        return;
    }

    // Verify the JWT
    JWTUtil.verifyCalbiticaJWT(req.session.user)
        .then(result => {
            // JWT verification successful.
            // Set the credentials in the Habitica
            // and Google Clients
            authController.setHnGCredentials(result.decoded)

            // Set the decoded JWT object to the req.body 
            // for our controllers' use
            req.body.decodedJWT = result.decoded;
            next(); // continue route execution
        })
        .catch(err => {
            if (!err.status || !err.decoded) {
                req.session = null;
                res.redirect('/auth/login');
                return;
            }

            let accessTokenExpiring = err.status == 444;
            if (accessTokenExpiring || err.status == 443) {
                // Refresh the JWT
                authController.refreshJWT(err.decoded, accessTokenExpiring)
                    .then((result) => {
                        authController.setHnGCredentials(result.decoded)

                        // You can still use the old JWT for now - it's
                        // expiring, not expired. BUT:
                        // Store the new JWT in the session
                        req.body.decodedJWT = err.decoded;
                        if (result.newJWT != undefined) {
                            req.session.user = result.newJWT;
                        }

                        next();
                    })
                    .catch((err) => {
                        req.session = null;
                        res.redirect('/auth/login');
                    })
            } else {
                req.session = null;
                res.redirect('/auth/login');
            }
        });
}

/**
 * Is the user logged in ? Yes -> redirect to dashboard
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const authCheckIsLoggedin = (req, res, next) => {
    (!req.session.user)
        ? next()
        : res.redirect('/dashboard');
}

module.exports.mustLogin = authCheckMustLogin;
module.exports.isLoggedin = authCheckIsLoggedin;