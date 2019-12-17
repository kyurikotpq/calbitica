function apiErrorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    console.error(err)
    res.status(err.status).json({ message: err.message });
}

module.exports = apiErrorHandler;