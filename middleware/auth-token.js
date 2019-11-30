/**
 * Middleware to 
 * - retrieve auth code from the URL query param
 * - retrieve access and [refresh tokens + store in DB]
 */

const oauth2Client = require('../config/google-setup');
const { google } = require('googleapis');
const User = require('../models/user');
const crypt = require('../util/crypt');

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

        if (old_refresh_token != refresh_token) { // old refresh token is different
            user.refresh_tokens[index] = refresh_token;
            user.save();
        }

        req.session.user = user.profile;
        req.session.habiticaAPI = (!user.habiticaAPI)
            ? null
            : crypt.decrypt(user.habiticaAPI);

        next();
    } else { // user doesn't exist
        // Create a new User
        new User({
            googleIDs: [profile.id],
            refresh_tokens: [refresh_token],
            profile: {
                displayNames: [profile.name],
                thumbnails: [profile.picture],
            },
        }).save()
          .then((newUserObj) => {
              req.session.user = newUserObj.profile;
              req.session.habiticaAPI = null;
              next();
          })
          .catch((err) => {
              console.log(err);
          });
    }
}

/**
 * Retrieve authorization code and later tokens from Google
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
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

    oauth2Client.getToken(code)
    .then((data) => {
        // retrieve the profile....
        let tokens = data.tokens;
        let refresh_token = crypt.encrypt(tokens.refresh_token);
        oauth2Client.setCredentials(tokens);

        // store the accessToken in the cookies
        req.session.access_token = crypt.encrypt(tokens.access_token);
        console.log(req.session.access_token)

        google.oauth2("v2").userinfo.get()
        .then((json) => {
            let profile = json.data;

            // check if user exists in DB
            User.findOne({ googleIDs: profile.id })
                .then((user) => handleOAuthSuccess(
                    req,
                    next,
                    { user, profile, refresh_token }
                ));
        })
        .catch((err) => {
            if (err) {
                console.log("ERROR GETTING PROFILE")
                console.log(err);
                return;
            }
            next();
        });
    })
    .catch((err) => {
        console.log(err)
        next();
    });
}

module.exports = retrieveTokens;