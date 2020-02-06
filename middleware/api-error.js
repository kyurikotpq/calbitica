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
    let status = (err.status != undefined) ? err.status : 500;
    let message = (err.message != undefined) ? err.message : "Internal Server Error";
    
    res.status(status).json({ message });
}

module.exports = apiErrorHandler;