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
        .then(result => {
            authController.setHnGCredentials(result.decoded)

            if (!result.newJWT) {
                req.body.decodedJWT = result.decoded;
            } else {
                req.body.decodedJWT = result.newDecodedJWT;
            }

            next();
        })
        .catch(err => {
            next({ status: 400, message: err });
        });
}

module.exports = isValidCalbiticaJWT;