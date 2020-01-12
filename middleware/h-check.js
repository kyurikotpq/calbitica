/**
 * Is there a Habitica ID and API key provided?
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const hasIDAndAPIKey = (req, res, next) => {
    let decodedJWT = req.body.decodedJWT;
    if (!decodedJWT.habiticaAPI || !decodedJWT.habiticaID) {
        next({ 
            status: 400, 
            message: "Please enter your Habitica ID & API Key to continue." 
        });
        return;
    }

    next();
}

module.exports = hasIDAndAPIKey;