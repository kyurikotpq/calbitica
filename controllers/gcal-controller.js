// In charge of interfacing with the Google Calendar API
const { google } = require('googleapis');
const cal = google.calendar({ version: 'v3' });

/**
 * List all calendars associated with the Google account
 * 
 * @param {String} nextSyncToken
 */
function listCal(nextSyncToken = null) {
    let params = {};
    if (nextSyncToken)
        params.syncToken = nextSyncToken;
    else {
        params = {
            maxResults: 20,
            showDeleted: false,
        };
    }

    return cal.calendarList.list(params);
}

/**
 * List all events in the specified Google Calendar.
 * 
 * @param {GoogleID} calendarId 
 * @param {String} syncToken 
 * @param {Date|null} startDate 
 * @param {Date|null} endDate 
 */
function listEvents(calendarId, syncToken, startDate = null, endDate = null) {
    let params = {
        calendarId,
        maxResults: 300,

        // I need to know what's deleted so can delete from Habitica too
        // Deleted events' status = cancelled
        showDeleted: true,
    };

    if (!syncToken) {
        if (startDate != null && startDate.getTime() > 0)
            params.timeMin = startDate.toISOString();

        if (endDate != null && endDate.getTime() > 0)
            params.timeMax = endDate.toISOString();
    } else {
        params.syncToken = syncToken;
    }

    return cal.events.list(params)
}

/**
 * Create or update an event in Google Calendar
 * 
 * @param {GoogleID} calendarId 
 * @param {Object} body 
 * @param {GoogleID} eventId 
 */
function saveEvent(calendarId, body, eventId = null) {
    let resource = {
        summary: body.summary,
        start: body.start,
        end: body.end
    }

    if (body.description)
        resource.description = body.description;

    if (body.location)
        resource.location = body.location;

    let params = {
        calendarId,
        resource
    };

    if (eventId)
        params.eventId = eventId;

    /*
    * Patch: "The field values you specify replace the existing values. 
    * Fields that you don’t specify in the request remain unchanged."
    */
    return (eventId) ? cal.events.patch(params) : cal.events.insert(params);
}


/**
 * Delete an event from Google Calendar
 * @param {GoogleID} calendarId 
 * @param {GoogleID} eventId 
 */
function deleteEvent(calendarId, eventId) {
    return cal.events.delete({ calendarId, eventId });
}

/**
 * Compile the functions into one object
 */
let gcalController = {
    listCal,
    listEvents,
    saveEvent,
    deleteEvent,
}

module.exports = gcalController;