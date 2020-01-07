/**
 * This controller
 * 1) verifies ID tokens from Android/iOS apps
 * 2) Handles OAuth in NodeJS
 * 3) Handles OAuth in apps
 * 
 */
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/user-model');
const DateUtil = require('../util/date');
const Crypt = require('../util/crypt');

/**
 * Handle the storing of user profile in session
 * @param {*} req 
 * @param {*} next 
 * @param {*} userObj (user, profile, refresh_token) 
 */
function handleOAuthSuccess(req, next, userObj) {
    let user = userObj.user,
        profile = userObj.profile,
        refresh_token = userObj.refresh_token;

    if (user) { // user exists
        // update the refresh token if necessary
        // get indexof the googleID & retrieve the token in the same index
        let index = user.googleIDs.indexOf(profile.id);
        let old_refresh_token = user.refresh_tokens[index];
        let newRefreshToken = old_refresh_token;

        if (refresh_token != '' && old_refresh_token != refresh_token) { // old refresh token is different
            user.refresh_tokens[index] = refresh_token;
            newRefreshToken = refresh_token;
            user.save();
        }

        req.session.refresh_token = newRefreshToken;
        
        req.session.calbitAPI = user.calbitAPI.find(obj => obj.type == 'mvc').key;
        req.session.user = user.profile;
        req.session.habiticaID = (!user.habiticaID)
            ? null : user.habiticaID;
        req.session.habiticaAPI = (!user.habiticaAPI)
            ? null : user.habiticaAPI;

        next();
    } else { // user doesn't exist, create new user
        const calbitAPI = Crypt.random();

        new User.model({
            calbitAPI: [
                {
                    $type: 'mvc', // 'type' is a reserved word in Mongoose!
                    login: new Date(),
                    expiry: DateUtil.add(new Date(), 'd', 10),
                    key: calbitAPI
                }
            ],
            habiticaAPI: null,
            habiticaID: null,
            googleIDs: [profile.id],
            refresh_tokens: [{
                $type: 'mvc',
                key: refresh_token
            }],
            profile: {
                displayNames: [profile.name],
                thumbnails: [profile.picture],
            },
        }).save()
            .then((newUserObj) => {
                req.session.refresh_token = refresh_token;
                req.session.calbitAPI = calbitAPI;
                req.session.user = newUserObj.profile;
                req.session.habiticaID = null;
                req.session.habiticaAPI = null;
                next();
            })
            .catch((err) => {
                console.log(err);
            });
    }
}

function handleUser(obj) {
    let user = obj.user,
        refresh_token = obj.refresh_token,
        type = obj.type,
        profile = obj.profile;
    
    if (!user) {
        const calbitAPI = Crypt.random();
        let data = {
            calbitAPI: [
                {
                    type: type, // 'type' is a reserved word in Mongoose!
                    login: new Date(),
                    expiry: DateUtil.add(new Date(), 'd', 10),
                    key: calbitAPI
                }
            ],
            habiticaAPI: null,
            habiticaID: null,
            googleIDs: [profile.googleID],
            refresh_tokens: [{
                type: 'mvc',
                key: refresh_token
            }],
            profile: {
                displayNames: [profile.name],
                thumbnails: [profile.picture],
            },
        };

        return new User.model(data).save();
    } else {
        // user exists
        // update the refresh token if necessary
        let index = user.refresh_tokens.map(t => t.type).indexOf(type);
        let old_refresh_token = user.refresh_tokens[index];

        if (refresh_token != '' && old_refresh_token != refresh_token) { // old refresh token is different
            user.refresh_tokens[index] = refresh_token;
            return user.save();
        }
    }
}

function getUserFromDB(refresh_token, type, profile) {
    return new Promise((resolve, reject) => {
        User.model.findOne({ googleIDs: profile.googleID })
            .then((user) => {
                handleUser({ refresh_token, type, user, profile })
                    .then((updatedUserObj) => {
                        resolve({
                            refresh_token: updatedUserObj.refresh_token,
                            calbitAPI,
                            user: profile,
                            habiticaID: null,
                            habiticaAPI: null,
                        });
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            })
            .catch(err => {
                console.log(err);
            })
    })
}


function profileFromIdToken(idToken) {
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
                if (`${process.env.GCLIENT_ID}.apps.googleusercontent.com`
                    != payload.aud || !payload.sub)
                    reject({ status: 400, message: "Invalid token" });

                else {
                    // Return basic profile info
                    resolve({
                        googleID: payload.sub,
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
    profileFromIdToken,
}

module.exports = authController;
