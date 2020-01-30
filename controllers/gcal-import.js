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
const DateUtil = require('../util/date');
const habiticaController = require('./h-controller');
const calbitController = require('./calbit-controller');
const calendarController = require('./calendar-controller');
const gcalController = require('./gcal-controller');

function listEventsFromGCal(calendars, fullSync = false) {
    let gcalEventsPromises = calendars.map(c => {
        return new Promise((resolve, reject) => {
            let nextSyncToken = fullSync
                ? null
                : (!c.nextSyncToken.events || !c.nextSyncToken.events.token)
                    ? null : c.nextSyncToken.events.token;

            gcalController.listEvents(c.googleID, nextSyncToken)
                .then(eventListResult => {
                    // store the nextSyncToken
                    let eventList = eventListResult.data;
                    calendarController.saveSyncToken(c.googleID, eventList.nextSyncToken)
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
 * @param {Event[]} events 
 * @param {ObjectID} userID
 */
function listSomeCalbitsAndCompare(events, userID) {
    return new Promise((resolve, reject) => {
        calbitController.getAllCalbits(
            userID, false, true, 
            { googleID: { $in: events.map(e => e.id) }}
        )
            .then(calbits => {
                resolve(compareItems(events, calbits, userID));
            })
            .catch(err => {
                reject(err);
            });
    })
}

/**
 * Get all calbits belonging to the user and compare
 * calbits with the gcal events (full sync)
 * @param {Event[]} events 
 * @param {ObjectID} userID MongoDB ID
 */
function listAllCalbitsAndCompare(events, userID) {
    return new Promise((resolve, reject) => {
        calbitController.getAllCalbits(userID, false, true)
            .then(calbits => {
                resolve(compareItems(events, calbits, userID));
            })
            .catch(err => {
                reject(err);
            });
    })
}

function compareItems(events, calbits, userID) {
    return new Promise((resolve, reject) => {
        let updatedPromises = [];
        let notInCalbitArr = calbits.filter(c => {
            let gcalItem = events.find(e => c.googleID == e.id && e.status != 'cancelled');
            if (gcalItem != undefined) {
                // update mongo
                updatedPromises.push(calbitController.updateCalbit(c._id, gcalItem, 'gcal'))
            }

            // else - calbit no longer exists in gCal, delete it
            return gcalItem == undefined || gcalItem.status == 'cancelled';
        });

        let deletedPromises = [];
        notInCalbitArr.forEach(c => {
            deletedPromises.push(calbitController.deleteInMongo(c._id));
        });

        let createdPromises = [];
        events.forEach(gcalItem => {
            
            let existsInMongo = gcalItem.status == 'cancelled'
                || calbits.find(c => c.googleID == gcalItem.id);

            // If it doesn't exist, create in Habitica, then mongodb
            if (!existsInMongo) {
                habiticaController.saveToHabitica({
                    text: gcalItem.summary,
                    type: 'todo' // add support for habits & dailies in future
                })
                    .then((axiosResponse) => {
                        let hResponse = axiosResponse.data;

                        if (hResponse.success) {
                            gcalItem.habiticaID = hResponse.data.id;
                            gcalItem.habiticaType = hResponse.data.type;
                            createdPromises.push(calbitController.createCalbit(gcalItem, userID, 'gcal'))
                        }
                    })
                    .catch(err => { });
            }
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

/**
 * ROUTE Entry point for GCal -> Habitica -> Mongo
 * 
 * Only synced calendars will have their events imported.
 * 
 * @param {ObjectID} userID
 * @param {Boolean} fullSync
 */
function gcalImporter(userID, fullSync) {
    return new Promise((resolve, reject) => {
        calendarController.listCal(userID, true, true)
            .then(calendars => {
                listEventsFromGCal(calendars, fullSync)
                    .then(response => {
                        if (response.failure.length > 0) {
                            let errorCals = response.failure.map(errorCal => errorCal.calendar);
                            listEventsFromGCal(errorCals, true)
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
                                            resolve(listAllCalbitsAndCompare(finalArr, userID))
                                        else
                                            resolve(listSomeCalbitsAndCompare(finalArr, userID));
                                    }
                                });
                        } else if (response.database.length > 0) {
                            reject({ status: 500, message: response.database[0] });
                        } else {
                            // no errors - return the successful calendar events
                            if (fullSync)
                                resolve(listAllCalbitsAndCompare(response.success, userID))
                            else
                                resolve(listSomeCalbitsAndCompare(response.success, userID));
                        }
                    })
            })
            .catch(err => {
                reject({ status: err.code, message: err.errors[0].message });
            })
    });
}


module.exports = gcalImporter;
