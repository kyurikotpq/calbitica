/**
 * Handles errors to be returned via API routes
 * @param {*} err 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function apiErrorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    console.error(err)
    let status = (!err.status) ? 500 : err.status;
    let message = (!err.message) ? "Internal Server Error" : err.message;
    
    res.status(status).json({ message });
}

module.exports = apiErrorHandler;