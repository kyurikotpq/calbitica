// In charge of interfacing with the Google Calendar API
const { google } = require('googleapis');
const cal = google.calendar({
    version: 'v3'
});

let gcalController = {
    calList() {
        return cal.calendarList.list({
            maxResults: 20,
            showDeleted: false
        });
    }
};

module.exports = gcalController;