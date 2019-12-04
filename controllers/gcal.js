// In charge of interfacing with the Google Calendar API
const { google } = require('googleapis');
const cal = google.calendar({
    version: 'v3'
});

/**
 * List all calendars associated with the account
 */
function listCal() {
    return cal.calendarList.list({
        maxResults: 20,
        showDeleted: false
    });
}

/**
 * Compile the functions into one object
 */
let gcalController = {
    listCal
}

module.exports = gcalController;