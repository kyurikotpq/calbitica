/**
 * This controller:
 * 1) Handles OAuth from mobile apps, verifying the id_token
 *    sent by the app and sending back the required JWT for
 *    app access to the Calbitica API
 */

const { OAuth2Client } = require('google-auth-library');

const axiosInstance = require('../config/h-axios-setup');
const gCalOAuth2Client = require('../config/google-setup');

const User = require('../models/user-model');
const JWTUtil = require('../util/jwt');
const Crypt = require('../util/crypt');


function login(user, profile, refresh_token, access_token) {
    return new Promise((resolve, reject) => {
        // update the refresh token if necessary
        // get indexof the googleID & retrieve the token in the same index
        let index = user.googleIDs.indexOf(profile.id);
        let cipherRefreshToken = user.refresh_tokens[index];
        let plainRefreshToken = Crypt.decrypt(cipherRefreshToken);
        let newRefreshToken = cipherRefreshToken;

        if (refresh_token != '' && plainRefreshToken != refresh_token) {
            // old refresh token is different
            let newCipherRefreshToken = Crypt.encrypt(refresh_token);
            user.refresh_tokens[index] = newCipherRefreshToken;
            newRefreshToken = newCipherRefreshToken;
            user.save();
        }

        let data = {
            access_token,
            refresh_token: newRefreshToken,
            profile: user.profile,
            habiticaID: (!user.habiticaID) ? null : user.habiticaID,
            habiticaAPI: (!user.habiticaAPI) ? null : user.habiticaAPI,
        };

        let jwt = JWTUtil.signCalbiticaJWT(data, user._id.toString()); // MongoDB ID

        // data.user = jwt;
        resolve(jwt);

    })
}


function register(profile, refresh_token, access_token) {
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
                let data = {
                    access_token,
                    refresh_token: cipherRefreshToken,
                    profile: newUserObj.profile,
                    habiticaID: null,
                    habiticaAPI: null,
                };

                let jwt = JWTUtil.signCalbiticaJWT(data, newUserObj._id.toString()); // MongoDB ID

                // data.user = jwt;
                resolve(jwt);
            })
            .catch((err) => {
                console.log(err);
                reject(err);
            });

    })
}


function userExistsInMongo(idToken, refresh_token, access_token) {
    return new Promise((resolve, reject) => {
        verifyGIDToken(idToken)
            .then(profile => {
                User.model.findOne({ googleIDs: profile.id })
                    .then(user => {
                        let cipherAccessToken = Crypt.encrypt(access_token);

                        if(!refresh_token)
                            refresh_token = '';
                        
                        if (!user)
                            resolve(register(profile, refresh_token, cipherAccessToken));
                        else
                            resolve(login(user, profile, refresh_token, cipherAccessToken));
                    })
            })
            .catch(err => {
                reject(err);
            })
    });
}

function setHnGCredentials(decodedJWT) {
    if (decodedJWT.habiticaAPI && decodedJWT.habiticaID) {
        let plainHabiticaAPI = Crypt.decrypt(decodedJWT.habiticaAPI);

        // QOTD: Will this affect when I have multiple users using the app?
        axiosInstance.defaults.headers.common['x-api-key'] = plainHabiticaAPI;
        axiosInstance.defaults.headers.common['x-api-user'] = decodedJWT.habiticaID;
    }

    gCalOAuth2Client.setCredentials({
        access_token: Crypt.decrypt(decodedJWT.access_token),
        refresh_token: Crypt.decrypt(decodedJWT.refresh_token)
    });
}


/**
 * Verify Google-generated idToken
 * and pass back a JWT so that the app can communicate 
 * with the Calbitica API
 * @param {JWT} idToken 
 */
function verifyGIDToken(idToken) {
    const client = new OAuth2Client(process.env.GCLIENT_ID);

    return new Promise((resolve, reject) => {
        client.verifyIdToken({
            idToken,
            audience: process.env.GCLIENT_ID,
        })
            .then(ticket => {
                const payload = ticket.getPayload();

                // check: does the aud claim match my client ID?
                // does the "sub" claim exist?
                if (process.env.GCLIENT_ID != payload.aud || !payload.sub)
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
                console.log("GOOGLE AUTH ERROR", err);
                reject({ status: 400, message: "Invalid token" });
            });
    });
}

let authController = {
    verifyGIDToken,
    userExistsInMongo,
    setHnGCredentials
}

module.exports = authController;