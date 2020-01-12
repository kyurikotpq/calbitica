/**
 * Verifies all JWT sent by anywhere (to be called by
 * the api-check middleware only!)
 */

const jwt = require('jsonwebtoken');
const DateUtil = require('../util/date');

const audRegex = new RegExp(`${process.env.CALBITICA_SUBDOMAIN_ID}$`);

/**
 * Return a signed JWT, using a symmetric key.
 * 
 * payload: Anything you wanna pass back,
 * MINIMALLY the user's MongoDB ID as sub
 * @param {Object} payload 
 * @param {ObjectID} userID 
 */
function signCalbiticaJWT(payload, userID) {
    let signOptions = {
        issuer: process.env.CALBITICA_ID,
        audience: `${userID}.${process.env.CALBITICA_SUBDOMAIN_ID}`,
        subject: userID,
        expiresIn: "10d" // expires in 10 days
        // expiresIn: 60 // expires in 60s
    };

    // create a token
    return jwt.sign(
        payload,
        process.env.COOKIE_KEY,
        signOptions
    );
}

/**
 * Verify that the JWT was signed by Calbitica
 * @param {JWT} token
 */
function verifyCalbiticaJWT(token) {
    let verifyOptions = {
        issuer: process.env.CALBITICA_ID,
        audience: audRegex,
    };

    console.log("JWT: ", token)
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.COOKIE_KEY, verifyOptions,
            // You can't turn this into a promise :(
            function (err, decoded) {
                let userID = '';
                if (decoded)
                    userID = decoded.sub;

                if (err || decoded.aud != `${userID}.${process.env.CALBITICA_SUBDOMAIN_ID}`) {
                    let reason = !err ? "Invalid audience and subject" : err.message;

                    reject(reason);
                    return;
                }

                // Check expiry and resolve decoded JWT
                // with a new JWT :)
                let finalResponse = { decoded };
                if (isExpiring(decoded.exp)) {
                    let payload = {
                        access_token: decoded.access_token,
                        refresh_token: decoded.refresh_token,
                        profile: decoded.profile,
                        habiticaID: decoded.habiticaID,
                        habiticaAPI: decoded.habiticaAPI,
                    };
                    finalResponse.newJWT = signCalbiticaJWT(payload, userID);
                    finalResponse.newDecodedJWT = payload;

                    console.log("TRYNA NEW JWT: ", finalResponse);

                }

                resolve(finalResponse);
            })
    })
}

/**
 * Is the JWT expiring soon?
 * @param {Number} exp Number of SECONDS since the epoch
 */
function isExpiring(exp) {
    let now = new Date().getTime();
    let oneDayInMs = DateUtil.getMs("h", 24);

    return ((exp * 1000) - now <= oneDayInMs);
}

module.exports = { signCalbiticaJWT, verifyCalbiticaJWT };