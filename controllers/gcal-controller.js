// In charge of interfacing with the Google Calendar API
const { google } = require('googleapis');

/**
 * Compile the  into one object
 */
class GCalController {
    constructor(googleOAuth2Client) {
        this.cal = google.calendar({
            version: 'v3',
            auth: googleOAuth2Client
        });
    }

    /**
     * List all calendars associated with the Google account
     * 
     * @param {String} nextSyncToken
     */
    listCal(nextSyncToken = null) {
        let params = {};
        if (nextSyncToken)
            params.syncToken = nextSyncToken;
        else {
            params = {
                maxResults: 20,
                showDeleted: false,
            };
        }

        return this.cal.calendarList.list(params);
    }

    /**
     * List all events in the specified Google Calendar.
     * 
     * @param {GoogleID} calendarId 
     * @param {String} syncToken
     */
    listEvents(calendarId, syncToken = null) {
        let params = {
            calendarId,
            maxResults: 300,
            singleEvents: true,
        };

        (!syncToken)
            ? params.showDeleted = false
            : params.syncToken = syncToken;
            
        return this.cal.events.list(params)
    }

    /**
     * Create or update an event in Google Calendar
     * 
     * @param {GoogleID} calendarId 
     * @param {Object} body 
     * @param {GoogleID} eventId 
     */
    saveEvent(calendarId, body, eventId = null) {
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
        return (eventId) 
        ? this.cal.events.patch(params) 
        : this.cal.events.insert(params);
    }


    /**
     * Delete an event from Google Calendar
     * @param {GoogleID} calendarId 
     * @param {GoogleID} eventId 
     */
    deleteEvent(calendarId, eventId) {
        return this.cal.events.delete({ calendarId, eventId });
    }
}

module.exports = GCalController;