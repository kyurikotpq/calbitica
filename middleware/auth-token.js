/**
 * MVC Middleware to 
 * - retrieve auth code from the URL query param
 * - retrieve access and [refresh tokens + store in DB]
 */

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

    authController.tokensFromAuthCode(code)
        .then(jwt => {
            // store the JWT in the cookies
            req.session.user = jwt;
            next();
        })
        .catch(err => next(err));
}

module.exports = retrieveTokens;