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

    // We need to modify the JSON function later
    // if it's a non-MVC call
    let jsonFunc = res.json;

    // Verify the JWT
    JWTUtil.verifyCalbiticaJWT(jwt)
        .then(result => {
            // JWT is safe for now - continue normally
            let { googleOAuth2Client, axiosInstance }
                = authController.setHnGCredentials(result.decoded);

            res.locals.googleOAuth2Client = googleOAuth2Client;
            res.locals.axiosInstance = axiosInstance;

            res.json = (data) => {
                // data: whatever data you passed during .json(xxx)
                let finalResponse = {};

                // If you're not passing back a JWT
                // (from /api/settings or /auth/code)
                // then park the data in data key
                if (!internal && !data.jwt) {
                    finalResponse.data = data;

                } else // flatten the structure for our MVC
                    finalResponse = data;

                // Express 4.17: Use apply(), not call()
                // also "this" is an empty obj lmao
                jsonFunc.call(res, finalResponse);
            };

            req.body.decodedJWT = result.decoded;
            next();
        })
        .catch(err => {
            if (!err.decoded) {
                next({ status: 400, message: err });
                return;
            }

            let accessTokenExpiring = err.status == 444;
            if (accessTokenExpiring || err.status == 443) {
                // JWT/access token is expiring!
                // Refresh the JWT and access token
                authController.refreshJWT(err.decoded, accessTokenExpiring)
                    .then((result) => {
                        let { googleOAuth2Client, axiosInstance }
                            = authController.setHnGCredentials(result.decoded);

                        res.locals.googleOAuth2Client = googleOAuth2Client;
                        res.locals.axiosInstance = axiosInstance;

                        if (internal && result.newJWT != undefined)
                            req.session.user = result.newJWT;

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
                            } else // flatten the structure for our MVC
                                finalResponse = data;

                            // Express 4.17: Use apply(), not call()
                            // also "this" is an empty obj lmao
                            jsonFunc.call(res, finalResponse);
                        };

                        req.body.decodedJWT = result.decoded;
                        next();
                    })
                    .catch((err) => {
                        let errResponseObj = (!err.status || !err.message)
                            ? { 
                                status: 400, 
                                message: "Something went wrong. Please sign out and sign in again." 
                            }
                            : err

                        next(errResponseObj);
                    })
            }
        });
}

module.exports = isValidCalbiticaJWT;