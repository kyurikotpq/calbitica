const router = require('express').Router();

const authController = require('../../controllers/auth-controller');

router.post('/code', (req, res) => {
    let code = req.body.code;
    authController.tokensFromAuthCode(code)
        .then((jwt) => res.status(200).json({
            message: "Successfully signed in to Calbitica.",
            jwt
        }))
        .catch(err => res.status(400).json({ 
            message: "Could not sign in to Calbitica" 
        }));
})

module.exports = router;