/**
 * Middleware to check if the API call is 
 * internal (ExpressJS MVC) or external (API call 
 * from elsewhere i.e. the mobile apps)
 * 
 * and regardless of the type of call, 
 * if it's a valid JWT key, allow access!
 */
const JWTUtil = require('../util/jwt');
const authController = require('../controllers/auth-controller');

/**
 * Is the Calbitica JWT provided valid?
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const isValidCalbiticaJWT = (req, res, next) => {
    let internal = req.session.user;
    let external = req.header("Authorization");
    let jwt = (!internal) ? external.replace("Bearer ", '') : internal;

    JWTUtil.verifyCalbiticaJWT(jwt)
        .then(decodedJWT => {
            authController.setHnGCredentials(decodedJWT)
            req.body.decodedJWT = decodedJWT;
            next();
        })
        .catch(err => {
            next({ status: 500, message: err });
        });
}

module.exports = isValidCalbiticaJWT;