/**
 * This controller:
 * 1) Handles OAuth from mobile apps, verifying the id_token
 *    sent by the app and sending back the required JWT for
 *    app access to the Calbitica API
 */
const axiosInstance = require('../config/h-axios-setup');
const googleOAuth2Client = require('../config/google-setup');

const User = require('../models/user-model');
const JWTUtil = require('../util/jwt');
const DateUtil = require('../util/date');
const Crypt = require('../util/crypt');


/**
 * Log the user in, saving new refresh_token if any
 * And returning a signed JWT containing auth tokens
 * @param {User} user MongoDB User Object
 * @param {GoogleProfile} profile Google Profile object returned from verifyIDToken()
 * @param {Object} oAuthData contains refresh_token, access_token and expiry_date minimally
 */
function login(user, profile, oAuthData) {
    let { refresh_token, access_token, expiry_date } = oAuthData;

    return new Promise((resolve, reject) => {
        // update the refresh token if necessary
        // get indexof the googleID & retrieve the token in the same index
        let index = user.googleIDs.indexOf(profile.id);
        let cipherStoredRefreshToken = user.refresh_tokens[index];
        let newRefreshToken = cipherStoredRefreshToken || '';
      
        // stored refresh token is different from incoming refresh token
        if (cipherStoredRefreshToken != undefined && refresh_token != '') {
            let plainStoredRefreshToken = Crypt.decrypt(cipherStoredRefreshToken);
    
            if(plainStoredRefreshToken != refresh_token) {
                let newCipherRefreshToken = Crypt.encrypt(refresh_token);
                user.refresh_tokens[index] = newCipherRefreshToken;
                user.save(); // Save the encrypted version of the new refresh_token
    
                newRefreshToken = newCipherRefreshToken;
            }
        }

        // Prepare the data for JWT signing
        let data = {
            access_token,
            expiry_date,
            refresh_token: newRefreshToken,
            profile: user.profile,
            habiticaID: (!user.habiticaID) ? null : user.habiticaID,
            habiticaAPI: (!user.habiticaAPI) ? null : user.habiticaAPI,
        };

        let jwt = JWTUtil.signCalbiticaJWT(data, user._id.toString()); // MongoDB ID
        resolve(jwt);
    })
}


/**
 * Register the user into MongoDB
 * And returning a signed JWT containing auth tokens
 * @param {GoogleProfile} profile Google Profile object returned from verifyIDToken()
 * @param {Object} oAuthData contains refresh_token, access_token and expiry_date minimally
 */
function register(profile, oAuthData) {
    let { refresh_token, access_token, expiry_date } = oAuthData;

    // Remember to encrypt the JWT!
    let cipherRefreshToken = Crypt.encrypt(refresh_token);
    return new Promise((resolve, reject) => {
        new User.model({
            habiticaAPI: null,
            habiticaID: null,
            googleIDs: [profile.id],
            refresh_tokens: [cipherRefreshToken],
            profile: {
                displayNames: [profile.name],
                thumbnails: [profile.picture],
            },
        }).save()
            .then((newUserObj) => {
                // Prepare the data for JWT signing
                let data = {
                    access_token,
                    expiry_date,
                    refresh_token: cipherRefreshToken,
                    profile: newUserObj.profile,
                    habiticaID: null,
                    habiticaAPI: null,
                };

                let jwt = JWTUtil.signCalbiticaJWT(data, newUserObj._id.toString()); // MongoDB ID
                resolve(jwt);
            })
            .catch((err) => {
                reject(err);
            });

    })
}


/**
 * Validate the idToken returned and check if user exists in MongoDB
 * @param {Object} oAuthData contains idToken, refresh_token, access_token
 */
function userExistsInMongo(oAuthData) {
    let { idToken, access_token,
          refresh_token, expiry_date } = oAuthData;

    return new Promise((resolve, reject) => {
        verifyGIDToken(idToken)
            .then(profile => {
                User.model.findOne({ googleIDs: profile.id })
                    .then(user => {
                        let cipherAccessToken = Crypt.encrypt(access_token);

                        if (!refresh_token)
                            refresh_token = '';

                        let newOAuthData = {
                            refresh_token,
                            access_token: cipherAccessToken,
                            expiry_date
                        };

                        if (!user)
                            resolve(register(profile, newOAuthData));
                        else
                            resolve(login(user, profile, newOAuthData));
                    })
            })
            .catch(err => {
                reject(err);
            })
    });
}


/**
 * Set Headers in our Habitica Axios instance
 * and set tokens in our Google OAuthClient
 * @param {Object} decodedJWT Decoded object of the JWT
 */
function setHnGCredentials(decodedJWT) {
    if (decodedJWT.habiticaAPI && decodedJWT.habiticaID) {
        let plainHabiticaAPI = Crypt.decrypt(decodedJWT.habiticaAPI);

        // QOTD: Will this affect when I have multiple users using the app?
        axiosInstance.defaults.headers.common['x-api-key'] = plainHabiticaAPI;
        axiosInstance.defaults.headers.common['x-api-user'] = decodedJWT.habiticaID;
    }

    googleOAuth2Client.setCredentials({
        access_token: Crypt.decrypt(decodedJWT.access_token),
        refresh_token: Crypt.decrypt(decodedJWT.refresh_token),
        expiry_date: decodedJWT.expiry_date
    });
}


/**
 * Verify Google-generated idToken
 * and pass back profile info for further processing
 * with the Calbitica API
 * @param {JWT} idToken 
 */
function verifyGIDToken(idToken) {
    return new Promise((resolve, reject) => {
        googleOAuth2Client.verifyIdToken({
            idToken,
            audience: [
                process.env.GCLIENT_ID, // MVC
                process.env.GCLIENT_IOS_ID, // iOS
                process.env.GCLIENT_ANDROID_ID, // Android
            ],
        })
            .then(ticket => {
                const payload = ticket.getPayload();

                // does the "sub" claim exist?
                if (!payload.sub)
                    reject({ status: 400, message: "Invalid token" });

                else {
                    // Return basic profile info
                    resolve({
                        id: payload.sub,
                        name: payload.name,
                        picture: payload.picture
                    });
                }
            })
            .catch(err => {
                reject({ status: 400, message: "Invalid token" });
            });
    });
}

/**
 * Retrieve OAuth tokens from Google using the provided Authorization code.
 * Then, sign in/up the user accordingly and return the signed Calbitica JWT
 * for the user's access to our API
 * @param {AuthCode} code Google Authorization code generated by the
 * sign-in libraries on respective platforms (Android, iOS)
 */
function tokensFromAuthCode(code) {
    return new Promise((resolve, reject) => {
        googleOAuth2Client.getToken(code)
            .then((data) => {
                // retrieve the profile....
                let tokens = data.tokens;

                // If the user has authorized the app b4,
                // refresh_token key will not exist -> don't do anything
                // else store the refresh_token in DB
                let refresh_token = (!tokens.refresh_token) ? "" : tokens.refresh_token;

                // Set tokens on the oAuth client
                googleOAuth2Client.setCredentials(tokens);

                let oAuthData = {
                    refresh_token,
                    idToken: tokens.id_token,
                    access_token: tokens.access_token,
                    expiry_date: tokens.expiry_date
                };

                // Check if the User Exists in MongoDB
                // and login/register accordingly.
                // Then, return the signed Calbitica JWT
                // for the user to use.
                userExistsInMongo(oAuthData)
                    .then(jwt => resolve(jwt))
                    .catch(err => reject(err));
            })
            .catch((err) => {
                reject(err);
            });
    })
}

/**
 * Refresh the JWT signed by Calbitica
 * @param {JWT} decoded Decoded JWT
 * @param {Bool} accessTokenExpiring access_token is expiring?
 */
function refreshJWT(decoded, accessTokenExpiring) {
    // I need a new payload even if I don't need a new access_token
    // This is to ensure that JWT-specific things like exp will be re-signed
    let payload = {
        access_token: decoded.access_token,
        refresh_token: decoded.refresh_token,
        expiry_date: decoded.expiry_date,
        profile: decoded.profile,
        habiticaID: decoded.habiticaID,
        habiticaAPI: decoded.habiticaAPI,
    };

    return new Promise((resolve, reject) => {
        if (!accessTokenExpiring) {
            resolve({
                newJWT: JWTUtil.signCalbiticaJWT(payload, decoded.sub),
                decoded: payload
            });
            return;
        }

        googleOAuth2Client.getAccessToken()
            .then((token_obj) => {
                let cipherAccessToken = Crypt.encrypt(token_obj.token)
                payload.access_token = cipherAccessToken
                payload.expiry_date = new Date().getTime() + DateUtil.getMs("h", 1)

                resolve({
                    newJWT: JWTUtil.signCalbiticaJWT(payload, decoded.sub),
                    decoded: payload
                })
            })
            .catch((err) => {
                // The refresh_token no longer works -
                // user has revoked our access to their account
                reject({ 
                    status: 410, 
                    message: "Your refresh token has expired. Please sign in again." 
                });
            });
    })
}

/**
 * Compile the functions for export
 */
let authController = {
    verifyGIDToken,
    setHnGCredentials,
    tokensFromAuthCode,
    refreshJWT,
}

module.exports = authController;