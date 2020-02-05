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
        res.redirect('/calbitica/auth/login');
        return;
    }

    // Retrieve the tokens from the give Authorization Code
    // Our controller will return the signed JWT
    authController.tokensFromAuthCode(code)
        .then(jwt => {
            // store the JWT in the cookies
            req.session.user = jwt;
            next();
        })
        .catch(err => next(err));
}

module.exports = retrieveTokens;