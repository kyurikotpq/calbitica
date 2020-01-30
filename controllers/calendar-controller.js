/**
 * Handles the CRUD of calendars in MongoDB
 */
const gcalController = require('./gcal-controller');
const Calendar = require('../models/calendar-model').model;
const Calbit = require('../models/calbit-model').model;

/**
 * List user's calendars in MongoDB
 * @param {ObjectID} userID (MongoDB ID)
 * @param {Boolean} syncedOnly Get only synced Calendars? Default no, get everything
 * @param {Boolean} importCal Import Calendars? Default yes
 */
function listCal(userID, syncedOnly = false, importCal = true) {
    return new Promise((resolve, reject) => {
        let calendarFilter = { userID };
        if (syncedOnly)
            calendarFilter.sync = syncedOnly;

        Calendar.find(calendarFilter)
            .then(calendars => {
                if (importCal) {
                    let syncToken = (calendars.length == 0)
                        ? null
                        : (!calendars[0].nextSyncToken.calendars || !calendars[0].nextSyncToken.calendars.token)
                            ? null : calendars[0].nextSyncToken.calendars.token;

                    importCalToMongo(userID, syncToken)
                        .then(result => resolve(Calendar.find(calendarFilter)))
                        .catch(err => { reject(err); })
                } else resolve(calendars);
            })
            .catch(err => { reject({ status: 500, message: err }); });
    });
}

/**
 * Import Google Calendars to MongoDB.
 * Will create new instances of Calendar if 
 * the Google Calendar has not been imported before.
 * 
 * @param {ObjectID} userID
 * @param {String} storedSyncToken
 */
function importCalToMongo(userID, storedSyncToken = null) {
    return new Promise((resolve, reject) => {
        gcalController.listCal(storedSyncToken)
            .then((calendarListResult) => {
                let calendarList = calendarListResult.data;
                if (calendarList.items.length > 0) {
                    Promise.all(handleCalendarList(userID, calendarList, storedSyncToken))
                        .then(calendars => resolve(1))
                        .catch(err => {
                            console.log(err);
                            reject({
                                status: 500,
                                message: "Could not save Google Calendars"
                            });
                        })
                } else resolve(1);
            })
            .catch(err => {
                console.log("ERROR FROM LINE 74", err);
                // if the token is expired, perform a full sync!
                if (err.status == 410) {
                    gcalController.listCal().then((calendarListResult) => {
                        Promise.all(handleCalendarList(userID, calendarListResult.data))
                            .then(calendars => {
                                resolve(calendars);
                            })
                            .catch(err => {
                                console.log(err);
                                reject({
                                    status: 500,
                                    message: "Could not save Google Calendars"
                                });
                            })
                    })
                } else {
                    reject({
                        status: 500,
                        message: "Could not retrieve Google Calendars"
                    });

                }
            })
    });
}

/**
 * Handle the saving (create/update) 
 * of Calendars to MongoDB
 * 
 * @param {ObjectID} userID 
 * @param {CalendarList} calendarList
 * @param {String} storedSyncToken
 */
function handleCalendarList(userID, calendarList, storedSyncToken) {
    let promises = calendarList.items.map(c => {
        let data = {
            summary: c.summary,
            description: c.description,
        };

        if (c.defaultReminders)
            data.defaultReminders = c.defaultReminders;

        if (c.notificationSettings)
            data.notificationSettings = c.notificationSettings;


        // importing a new calendar
        if (!storedSyncToken) {
            data.sync = false;
            data.userID = userID; // MongoDB User ObjectID
            data.googleID = c.id;
        }

        if (!storedSyncToken || storedSyncToken != calendarList.nextSyncToken) {
            data['nextSyncToken.calendars'] = {
                token: calendarList.nextSyncToken,
                retrieved: new Date()
            }
        }

        return Calendar.findOneAndUpdate(
            { userID, googleID: c.id },
            data,
            // creates new document if not found,
            // and returns the new (updated/created) document
            { upsert: true, new: true }
        );
    });

    return promises;
}

/**
 * Change the sync status of the specified calendar
 * @param {String} _id (MongoDB ObjectID)
 * @param {Boolean} sync 
 */
function changeSync(_id, sync = false) {
    return new Promise((resolve, reject) => {
        Calendar.findOne({ _id })
            .then(cal => {
                let syncedText = (`${sync}` == "true") ? "synced" : "unsynced";
                cal.sync = sync;

                cal.save().then(result => {
                    Calbit.updateMany(
                        { calendarID: cal.googleID }, // googleID = calendar's googleID
                        { display: sync }
                    )
                        .then((result) => {
                            resolve(`Calendar ${cal.summary} is now ${syncedText}`)
                        })
                        .catch(err => {
                            console.log(err);
                            reject({ 
                                status: 500, 
                                message: `Calendar ${cal.summary} could not be ${syncedText}.` 
                            });
                        })
                })
                    .catch(err => {
                        console.log(err);
                        reject({ 
                            status: 500, 
                            message: `Calendar ${cal.summary} could not be ${syncedText}.` 
                        });
                    })
            }).catch(err => {
                console.log(err);
                reject({ status: 404, message: "Could not find the specified calendar" });
            })


    });
}

/**
 * Update the specified calendar's 
 * EVENTS nextSyncToken in MongoDB
 * @param {String} googleID
 * @param {String} nextSyncToken 
 */
function saveSyncToken(googleID, nextSyncToken) {
    return Calendar.findOneAndUpdate(
        { googleID },
        {
            'nextSyncToken.events': {
                token: nextSyncToken,
                retrieved: new Date()
            }
        },
        { new: true }
    );
}

/**
 * Compile the functions into one object
 */
let calendarController = {
    listCal,
    importCalToMongo,
    changeSync,
    saveSyncToken,
}

module.exports = calendarController;