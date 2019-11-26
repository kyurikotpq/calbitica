/**
 * Middleware to 
 * - retrieve auth code from the URL query param
 * - retrieve access and [refresh tokens + store in DB]
 */

const oauth2Client = require('../config/google-setup');
const { google } = require('googleapis');
const User = require('../models/user');

const retrieveTokens = (req, res, next) => {
    let code = req.query.code; // authorization code
    let err = req.query.error; // error param if any

    if (!code) {
        // error occured - redirect to login page
        // TODO: Add error message
        console.log("OAUTH2 ERROR");
        console.log(err);
        res.redirect('/auth/login');
        return;
    }

    oauth2Client.getToken(code).then((data) => {
        // retrieve the profile....
        // store the accessToken in the cookies
        let tokens = data.tokens;
        oauth2Client.setCredentials(tokens);
        req.session.access_token = tokens.access_token;
        
        google.oauth2("v2").userinfo.get().then((json) => {
            let profile = json.data;

            // check if user exists in DB
            User.findOne({
                googleID: profile.id
            }).then((currentUserObj) => {
                if (currentUserObj) { // user exists
                    // update the refresh token if necessary
                    // get indexof the googleID & retrieve the token in the same index
                    let index = currentUserObj.googleID.indexOf(profile.id);
                    let old_refresh_token = currentUserObj.refresh_token[index];

                    if (old_refresh_token != tokens.refresh_token) { // old refresh token is different
                        currentUserObj.refresh_token[index] = tokens.refresh_token;
                        currentUserObj.save();
                    }

                    req.session.user = currentUserObj;
                    next();
                } else { // user doesn't exist
                    // Create a new User
                    new User({
                        displayName: profile.name,
                        googleID: [profile.id],
                        thumbnail: [profile.picture],
                        // TODO: encrypt this token
                        refresh_token: [tokens.refresh_token]
                    }).save().then((newUserObj) => {
                        req.session.user = newUserObj;
                        next();
                    });
                }
            });
        }).catch((err) => {
            if (err) {
                console.log("ERROR GETTING PROFILE")
                console.log(err);
                return;
            }
            next();
        });
    }).catch((err) => {
        console.log(err)
        next();
    });
}

module.exports = retrieveTokens;