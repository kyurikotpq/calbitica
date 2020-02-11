/**
 * In charge of importing GCal into Habitica.
 * GCal -> Habitica -> Mongo, not vice versa.
 * 
 * Rough flow: 
 * 1. Get list of Google Calendar events from synced calendars
 * 2. Get list of Calbits from MongoDB
 * 3. Compare the lists. Update, Delete, Create in Habitica.
 * 4. Update, Delete, Create in MongoDB (Calbit)
 * 
 * In this case, since the data flow is uni-directional,
 * Google Calendar is treated as the single source of truth
 * for all time (date, recurrence, etc.) related 
 * information. Only Calbits will be affected by this.
 * 
 * For summary, description, and location,
 * Calbitica will be treated as the single source of truth.
 * 
 */
const HabiticaController = require('./h-controller');
const CalbitController = require('./calbit-controller');
const CalendarController = require('./calendar-controller');
const GCalController = require('./gcal-controller');

class GCalImporter {
    constructor(googleOAuth2Client, axiosInstance) {
        this.calendarController = new CalendarController(googleOAuth2Client);
        this.gcalController = new GCalController(googleOAuth2Client);
        this.habiticaController = new HabiticaController(axiosInstance);
        this.calbitController = new CalbitController(googleOAuth2Client, axiosInstance);
    }

    /**
     * ROUTE Entry point for GCal -> Habitica -> Mongo
     * 
     * Only synced calendars will have their events imported.
     * 
     * @param {ObjectID} userID
     * @param {Boolean} fullSync
     */
    importCalbits(userID, fullSync) {
        return new Promise((resolve, reject) => {
            this.calendarController
                .listCal(userID, true, true)
                .then(calendars => {
                    this.listEventsFromGCal(calendars, fullSync)
                        .then(response => {
                            if (response.failure.length > 0) {
                                let errorCals = response.failure.map(errorCal => errorCal.calendar);
                                this.listEventsFromGCal(errorCals, true)
                                    .then(secondResponse => {
                                        if (secondResponse.failure.length > 0
                                            || secondResponse.database.length > 0) {
                                            let message = (secondResponse.failure.length > 0)
                                                ? secondResponse.failure[0].message
                                                : secondResponse.database[0];

                                            reject({ status: 500, message });
                                        } else {
                                            let finalArr = secondResponse.success.concat(response.success);

                                            if (fullSync)
                                                resolve(this.listAllCalbitsAndCompare(finalArr, userID))
                                            else
                                                resolve(this.listSomeCalbitsAndCompare(finalArr, userID));
                                        }
                                    });
                            } else if (response.database.length > 0) {
                                reject({ status: 500, message: response.database[0] });
                            } else {
                                // no errors - return the successful calendar events

                                if (fullSync)
                                    resolve(this.listAllCalbitsAndCompare(response.success, userID))
                                else
                                    resolve(this.listSomeCalbitsAndCompare(response.success, userID));
                            }
                        })
                })
                .catch(err => {
                    // If you're here, the errors most likely
                    // involve the access_token or refresh_token
                    let message = (err.errors != undefined && err.errors[0])
                        ? err.errors[0] : err.message;
                    let status = (err.code != undefined) ? err.code : err.status;

                    reject({ status, message });
                })
        });
    }

    /**
     * List events from all of the users' Google Calendars
     * @param {*} calendars Google Calendars
     * @param {*} fullSync Whether to perform a full sync or use an existing nextSyncToken
     */
    listEventsFromGCal(calendars, fullSync = false) {
        let gcalEventsPromises = calendars.map(c => {
            return new Promise((resolve, reject) => {
                let nextSyncToken = fullSync
                    ? null
                    : (!c.nextSyncToken.events || !c.nextSyncToken.events.token)
                        ? null : c.nextSyncToken.events.token;

                // Get events from Google Calendar
                this.gcalController
                    .listEvents(c.googleID, nextSyncToken)
                    .then(eventListResult => {
                        // store the nextSyncToken for a particular Calendar's events
                        let eventList = eventListResult.data;

                        this.calendarController
                            .saveSyncToken(c.googleID, eventList.nextSyncToken)
                            .then(result => {
                                // return the events
                                resolve(eventList.items.map(e => {
                                    e.calendarID = c.googleID;
                                    return e;
                                }));
                            })
                            .catch(err => {
                                resolve({ status: 500, message: err }); // MongoDB err
                            });
                    })
                    .catch(err => {
                        resolve({
                            status: err.code,
                            message: err.errors[0].message,
                            calendar: c
                        });
                    });
            })
        });

        return new Promise((resolve, reject) => {
            Promise.all(gcalEventsPromises)
                .then(promiseResults => {
                    // Compile the results of the previous operation
                    let errorCals = promiseResults.filter(r => r.status && r.status == 410);
                    let mongoErrors = promiseResults.filter(r => r.status && r.status == 500);
                    let correctCals = promiseResults.filter(r =>
                        !errorCals.includes(r) && !mongoErrors.includes(r)
                    ).flat();

                    resolve({
                        success: correctCals,
                        failure: errorCals,
                        database: mongoErrors,
                    });
                })
        });
    }

    /**
     * Get selected calbits belonging to the user and compare
     * calbits with the gcal events (incremental sync)
     * 
     * Since only synced calendars will be imported,
     * set display = true
     * @param {Event[]} events 
     * @param {ObjectID} userID
     */
    listSomeCalbitsAndCompare(events, userID) {
        return new Promise((resolve, reject) => {
            this.calbitController
                .getAllCalbits(
                    userID, false, true,
                    [{ googleID: { $in: events.map(e => e.id) } }]
                )
                .then(calbits => {
                    resolve(this.compareItems(events, calbits, userID));
                })
                .catch(err => {
                    reject(err);
                });
        })
    }

    /**
     * Get ALL calbits belonging to the user and compare
     * calbits with the gcal events (full sync)
     * 
     * Since only synced calendars will be imported,
     * set display = true
     * @param {Event[]} events 
     * @param {ObjectID} userID MongoDB ID
     */
    listAllCalbitsAndCompare(events, userID) {
        return new Promise((resolve, reject) => {
            this.calbitController
                .getAllCalbits(userID, false, true)
                .then(calbits => {
                    resolve(this.compareItems(events, calbits, userID));
                })
                .catch(err => {
                    reject(err);
                });
        })
    }

    compareItems(events, calbits, userID) {
        return new Promise((resolve, reject) => {
            let updatedPromises = [];
            let deletedCalbitArr = calbits.filter(c => {
                let gcalItemIndex = events.findIndex(e => {
                    return c.googleID == e.id
                });

                // If the MongoDB item can be found in Google Calendar,
                // update MongoDB with GCal information
                let existsInBoth = gcalItemIndex != -1;

                if (existsInBoth) {
                    updatedPromises.push(
                        this.calbitController.updateCalbit(
                            c._id, events[gcalItemIndex], 'gcal'
                        )
                    );

                    // remove the gcal item from the events arr so that 
                    // we won't iterate over that event again
                    events.splice(gcalItemIndex, 1);
                }

                // Calbit cannot be found in Google Calendar.
                // Delete corresponding calbit from MongoDB
                return !existsInBoth;
            });
            let deletedPromises = [];
            deletedCalbitArr.forEach(c => {
                deletedPromises.push(this.calbitController.deleteInMongo(c._id));
            });

            // At this point, events should be the ones that have 
            // no Calbit record in MongoDB
            let createdPromises = [];
            events.forEach(gcalItem => {
                // If calbit doesn't exist, but underlying GCal Event
                // has NOT been removed/completed,
                // create in Habitica, then mongodb
                this.habiticaController.saveToHabitica({
                    text: gcalItem.summary,
                    type: 'todo' // add support for habits & dailies in future
                })
                    .then((axiosResponse) => {
                        let hResponse = axiosResponse.data;

                        if (hResponse.success) {
                            gcalItem.habiticaID = hResponse.data.id;
                            gcalItem.habiticaType = hResponse.data.type;
                            createdPromises.push(
                                this.calbitController.createCalbit(gcalItem, userID, 'gcal')
                            );
                        }
                    })
                    .catch(err => { });

            });

            Promise.all([
                Promise.all(updatedPromises),
                Promise.all(deletedPromises),
                Promise.all(createdPromises),
            ])
                .then(result => {
                    let finalResults = {
                        success: {
                            updates: result[0].filter(code => code == 1).length,
                            deletes: result[1].filter(code => code == 1).length,
                            creates: result[2].filter(code => code == 1).length,
                        },
                        failure: {
                            updates: result[0].filter(code => code == -1).length,
                            deletes: result[1].filter(code => code == -1).length,
                            creates: result[2].filter(code => code == -1).length,
                        },
                    };
                    resolve(finalResults);
                })
                .catch(err => {
                    reject(err);
                })
        });

    }
}

module.exports = GCalImporter;
