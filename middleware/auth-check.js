/**
 * Middleware to check if user is logged in
 */
const JWTUtil = require('../util/jwt');
let authController = require('../controllers/auth-controller');

/**
 * Is the user logged in? No -> Redirect to login page
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const authCheckMustLogin = (req, res, next) => {
    if (!req.session.user) {
        req.session = null;
        res.redirect('/auth/login')
    } else {
        JWTUtil.verifyCalbiticaJWT(req.session.user)
            .then(result => {
                authController.setHnGCredentials(result.decoded)

                if (!result.newJWT) {
                    req.body.decodedJWT = result.decoded;
                } else {
                    req.session.user = result.newJWT;
                    req.body.decodedJWT = result.newDecodedJWT;
                }

                next();
            })
            .catch(err => {
                console.log("ERROR in AUTH-CHECK", err);
                req.session = null;
                res.redirect('/auth/login');
            });
    }
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