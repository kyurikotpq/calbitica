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
    let internal = (req.session != undefined && req.session.user != undefined);
    let external = req.header("Authorization") || 'lmao';
    let jwt = (!internal) ? external.replace("Bearer ", '') : req.session.user;

    JWTUtil.verifyCalbiticaJWT(jwt)
        .then(result => {
            authController.setHnGCredentials(result.decoded)

            req.body.decodedJWT = result.decoded;

            if (internal && result.newJWT != undefined)
                req.session.user = result.newJWT;

            let jsonFunc = res.json;
            res.json = (data) => {
                // data: whatever data you passed during .json(xxx)
                let finalResponse = {};

                // If you're not passing back a JWT
                // (from /api/settings or /auth/code)
                // then park the data in data key
                if (!internal && !data.jwt) {
                    finalResponse.data = data;

                    // there's a new JWT because the old
                    // one is expired!
                    if (result.newJWT)
                        finalResponse.jwt = result.newJWT;
                } else // flatten the structure
                    finalResponse = data;

                // Express 4.17: Use apply(), not call()
                // also "this" is an empty obj lmao
                jsonFunc.call(res, finalResponse);
            };

            next();
        })
        .catch(err => {
            next({ status: 400, message: err });
        });
}

module.exports = isValidCalbiticaJWT;