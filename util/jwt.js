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
        expiresIn: DateUtil.getMs('d', 10) // expires in 10 days
        // expiresIn: 1000 // expires in 1s
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

    console.log("JWT: ", token);
    // You can't turn this into a promise :(
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.COOKIE_KEY,
            verifyOptions,
            function (err, decoded) {
                let userID = '';
                if (decoded)
                    userID = decoded.sub;

                if (err || decoded.aud != `${userID}.${process.env.CALBITICA_SUBDOMAIN_ID}`) {
                    console.log("JWT DECODING ERROR", err);
                    console.log("ORIGINAL TOKEN", token);
                    console.log("VERIFY OPTIONS", verifyOptions);
                    let reason = !err ? "Invalid audience and subject" : err;

                    reject(reason);
                    return;
                }

                resolve(decoded);
            })
    })
}

function extendToken(token) {
    
}

module.exports = { signCalbiticaJWT, verifyCalbiticaJWT };