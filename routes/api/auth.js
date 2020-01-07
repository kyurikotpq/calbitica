const router = require('express').Router();

const authController = require('../../controllers/auth-controller');
const apiCheck = require('../../middleware/api-check');

router.post('/login', (req, res) => {
    let idToken = req.body.idToken;
    authController.verifyGIDToken(idToken)
        .then(result => res.status(200).json(result));

    // res.render('login');
})

// extend the current JWT token
router.post('/token/extend', apiCheck, (req, res) => {
    authController.userExistsInMongo(tokens.id_token, tokens.refresh_token, tokens.access_token)
        .then(jwt => {
            // store the JWT in the cookies
            req.session.user = jwt;
            next();
        })
        .catch(err => next(err));
})

module.exports = router;