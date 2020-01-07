/**
 * Is there a Habitica ID and API key provided?
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const hasIDAndAPIKey = (req, res, next) => {
    let jwt = req.body.decodedJWT;
    if (!jwt.habiticaAPI || !jwt.habiticaID) {
        next({ 
            status: 400, 
            message: "Please enter your Habitica ID & API Key to continue." 
        });
        return;
    }

    next();
}

module.exports = hasIDAndAPIKey;