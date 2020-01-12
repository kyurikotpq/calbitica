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
    let internal = (!req.session) ? false : req.session.user;
    let external = req.header("Authorization") || 'lmao';
    let jwt = (!internal) ? external.replace("Bearer ", '') : internal;

    JWTUtil.verifyCalbiticaJWT(jwt)
        .then(result => {
            authController.setHnGCredentials(result.decoded)

            req.body.decodedJWT = result.decoded;

            if (internal)
                req.session.user = result.newJWT;

            let jsonFunc = res.json;
            res.json = (data) => {
                // data: whatever data you passed during .json(xxx)
                let finalResponse = {};

                if(!internal) {
                    finalResponse.data = data;
    
                    if (result.newJWT && !data.jwt) {
                        finalResponse.jwt = result.newJWT;
                    }
                } else {
                    finalResponse = data;
                }

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