/**
 * Signs & verifies all JWT sent by anywhere
 * 
 * If the JWT is expiring, re-sign it
 * with new access_tokens from Google
 * (to be called by api-check middleware only!)
 */

const jwt = require("jsonwebtoken");
const DateUtil = require("./date");

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
        expiresIn: "10d"
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

    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.COOKIE_KEY, verifyOptions,
            // You can't turn this into a promise :(
            function (err, decoded) {
                let userID = '';
                if (decoded)
                    userID = decoded.sub;

                if (err || decoded.aud != `${userID}.${process.env.CALBITICA_SUBDOMAIN_ID}`
                    || !userID) {
                    let reason = !err ? "Invalid audience and subject" : err.message;

                    reject(reason);
                    return;
                }

                // Check expiry of JWT
                // expiry refreshing will be done by auth-controller
                let statuses = isExpiring(decoded.exp, decoded.expiry_date);
                if (statuses.isAccessTokenExpiring ||
                    statuses.isJWTExpiring) {

                    // 443: JWT is expiring
                    // 444: Access token is expiring
                    let status = statuses.isAccessTokenExpiring
                        ? 444 : 443;
                    reject({ status, decoded });
                    return;
                }

                // If the JWT is not expiring yet,
                // Just pass back the decoded JWT for our own use
                let finalResponse = { decoded };
                resolve(finalResponse);
            })
    })
}

/**
 * Is the JWT and the tokens within expiring soon?
 * @param {Number} exp JWT expiry: Number of SECONDS since the epoch
 * @param {Number} expiry_date access_token expiry: Number of Millseconds since the epoch
 */
function isExpiring(exp, expiry_date) {
    let oneDayInMs = DateUtil.getMs("d", 1);
    let tenMinsInMs = 10 * 60 * 1000;

    let isJWTExpiring = (DateUtil.timeFromNow(exp * 1000) <= oneDayInMs);
    let isAccessTokenExpiring = (DateUtil.timeFromNow(expiry_date) <= tenMinsInMs);

    return { isJWTExpiring, isAccessTokenExpiring };
}

let JWTUtil = {
    signCalbiticaJWT,
    verifyCalbiticaJWT
};

module.exports = JWTUtil;