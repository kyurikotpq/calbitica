/**
 * MVC Middleware to 
 * - retrieve auth code from the URL query param
 * - retrieve access and [refresh tokens + store in DB]
 */

const oauth2Client = require('../config/google-setup');
const authController = require('../controllers/auth-controller');

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

    // Automatically use refresh_tokens to get new access_tokens
    oauth2Client.on('tokens', (tokens) => {
        console.log(tokens);
        if (tokens.refresh_token) {
            // Set tokens on the oAuth client
            oauth2Client.setCredentials(tokens);
            // store the refresh_token in my database!
        }

        authController.userExistsInMongo(tokens.id_token, tokens.refresh_token, tokens.access_token)
            .then(jwt => {
                // store the JWT in the cookies
                req.session.user = jwt;
                next();
            })
            .catch(err => next(err));
        console.log(tokens.access_token);
    });

    oauth2Client.getToken(code)
        .then((data) => {
            // retrieve the profile....
            let tokens = data.tokens;

            // If the user has authorized the app b4,
            // refresh_token key will not exist -> don't do anything
            // else store the refresh_token in DB
            let refresh_token = (!tokens.refresh_token) ? "" : tokens.refresh_token;

            // Set tokens on the oAuth client
            oauth2Client.setCredentials(tokens);

            authController.userExistsInMongo(tokens.id_token, refresh_token, tokens.access_token)
                .then(jwt => {
                    // store the JWT in the cookies
                    req.session.user = jwt;
                    next();
                })
                .catch(err => next(err));
        })
        .catch((err) => {
            console.log(err)
            next();
        });
}

module.exports = retrieveTokens;