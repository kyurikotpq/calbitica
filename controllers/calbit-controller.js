/**
 * Handles the CRUD of calbits in MongoDB
 */
const Calbit = require('../models/calbit-model').model;
const HabiticaController = require('./h-controller');
const GCalController = require('./gcal-controller');

const TransformCalbitUtil = require('../util/transform-calbit');
const DateUtil = require('../util/date');

class CalbitController {
    constructor(googleOAuth2Client, axiosInstance) {
        this.habiticaController = new HabiticaController(axiosInstance);
        this.gcalController = new GCalController(googleOAuth2Client);
    }

    /**
     * Gets the user's calbits.
     * 
     * If isDump is null, dump & non-dump items 
     * will be returned (return all)
     * 
     * @param {ObjectID} userID 
     * @param {Boolean|null} isDump Get only dump items
     * @param {Boolean|null} displayOnly Get only displayed items
     * @param {Object[]|null} others Other search criteria
     */
    getAllCalbits(userID, isDump = null, displayOnly = null, others = null) {
        let criterion = [{ userID }];

        if (others && others.length > 0) {
            others.forEach(obj => criterion.push(obj))
        }

        // string comparison is required to protect against non-Boolean-castable values
        // thus, 'null' or 'lmao' are treated as false values
        if (isDump != null)
            criterion.push({ isDump: `${isDump}` == "true" });

        if (displayOnly != null)
            criterion.push({ display: `${displayOnly}` == "true" });

        let searchCriteria = { $and: criterion };

        // NOTE: location, description are optional and may not be in the field list.
        let fields = "_id summary description isDump calendarID googleID "
            + "completed start end location reminders";

        return new Promise((resolve, reject) => {
            Calbit.find(searchCriteria, fields)
                .sort({
                    "start.date": 'asc',
                    "start.dateTime": 'asc',
                })
                .then(calbits => {
                    resolve(
                        calbits.map(c => {
                            c = c.toObject();
                            c.legitAllDay = c.start.date != undefined;
                            c.allDay = DateUtil.isAllDay(c.start, c.end);
                            return c
                        })
                    )
                });
        });
    }

    /***
     * Save the event into MongoDB
     * @param {Calbit} data
     */
    createInMongo(data) {
        return new Promise((resolve, reject) => {
            let code = -1;
            Calbit.findOneAndUpdate(
                {
                    googleID: data.googleID,
                    calendarID: data.calendarID
                },
                data,
                { upsert: true }
            ).then(result => code = 1)
                .catch(err => { })
                .finally(() => resolve(code))
        })
    }

    /**
     * Create the event in Google Calendar (if from MVC/API call)
     * and then create the document in MongoDB
     * @param {Request} body 
     * @param {ObjectID} userID MongoDB ID
     * @param {String} dataFrom Where is this being called from?
     */
    createCalbit(body, userID, dataFrom) {
        let data = TransformCalbitUtil(body, userID, dataFrom);

        return new Promise((resolve, reject) => {
            if (dataFrom != 'gcal') {
                this.gcalController.saveEvent(body.calendarID, data)
                    .then((gcalEvent) => {
                        let gcalData = gcalEvent.data;
                        data.googleID = gcalData.id;
                        data.created = gcalData.created;

                        this.createInMongo(data)
                            .then(resultCode => {
                                if (resultCode == -1) {
                                    reject(resultCode);
                                    return;
                                }
                                resolve(resultCode);
                            })
                    })
                    .catch(err => {
                        reject(-1);
                    });
            } else {
                this.createInMongo(data)
                    .then(resultCode => {
                        if (resultCode == -1) {
                            resolve(resultCode);
                            return;
                        }
                        resolve(resultCode);
                    })
            }
        });
    }


    /***
     * Update the event into MongoDB
     * @param {ObjectID} _id Event's MongoDB ObjectId
     * @param {Calbit} data
     * @param {Boolean} mvc Whether this update is from the MVC/API
     */
    updateInMongo(_id, data, mvc = false) {
        return new Promise((resolve, reject) => {
            let code = -1, updatedCalbit = null;
            Calbit.findOneAndUpdate({ _id }, data, { new: true })
                .then(calbit => {
                    code = 1;
                    updatedCalbit = calbit;
                })
                .catch(err => { })
                .finally(() => {
                    (mvc && code == 1) ? resolve(updatedCalbit) : resolve(code);
                })
        })
    }


    /**
     * Update the event in Google Calendar (if from MVC/API call)
     * and then update the document in MongoDB
     * @param {Request} body 
     * @param {ObjectID} userID MongoDB ID
     * @param {String} dataFrom Where is this being called from?
     */
    updateCalbit(_id, body, dataFrom) {
        let data = TransformCalbitUtil(body, null, dataFrom);

        return new Promise((resolve, reject) => {
            new Promise((innerResolve, innerReject) => {
                if (dataFrom != 'gcal') {
                    this.gcalController
                        .saveEvent(body.calendarID, data, body.googleID)
                        .then((gcalEvent) => innerResolve(true))
                        .catch((err) => innerReject(err))
                } else innerResolve(true)
            })
                .then(result => {
                    this.updateInMongo(_id, data, true)
                        .then(calbitOrResultCode => {
                            if (calbitOrResultCode == -1) {
                                reject(calbitOrResultCode);
                                return;
                            }

                            // update in Habitica
                            let calbit = calbitOrResultCode;
                            this.habiticaController
                                .updateInHabitica(calbit.habiticaID,
                                    {
                                        text: calbit.summary,
                                        description: calbit.description,
                                        type: calbit.habiticaType
                                    })
                                .then((axiosResponse) => {
                                    resolve(1);
                                })
                                .catch(err => {
                                    reject(-1);
                                });
                        })
                })
                .catch(err => {
                    (dataFrom == 'mvc') ? reject(-1) : resolve(-1);
                })
        }); // end of outer promise
    }

    /**
     * Delete the event from Google, Habitica, and MongoDB
     * @param {ObjectID} _id MongoDB ObjectID of the Calbit
     * @param {Boolean} mvc Is this call from MVC?
     */
    deleteInMongo(_id, mvc = false) {
        return new Promise((resolve, reject) => {
            // Delete from habitica AND google calendar
            Calbit.findOneAndDelete({ _id })
                .then(deletedCalbit => {
                    this.gcalController
                        .deleteEvent(deletedCalbit.calendarID, deletedCalbit.googleID)
                        .then((gcalEvent) => {
                            this.habiticaController
                                .deleteInHabitica(deletedCalbit.habiticaID)
                                .then(axiosResponse => {
                                    (!mvc) ? resolve(1) : resolve(deletedCalbit);
                                })
                                .catch(err => {
                                    let errObj = {};

                                    if (err.code == "ECONNABORTED") {
                                        errObj = {
                                            status: 504,
                                            message: "Seems like the Habitica server is down. Please try agian in a short while."
                                        }
                                    } else {
                                        errObj = {
                                            status: (!err.response || !err.response.status)
                                                ? 400
                                                : err.response.status,
                                            message: (!err.response || !err.response.status)
                                                ? "Could not delete from Habitica"
                                                : err.response.data
                                        }
                                    }
                                    reject(errObj);
                                });
                        })
                        .catch(err => {
                            (mvc) ? reject(-1) : resolve(-1);
                        })
                })
                .catch(err => {
                    (mvc) ? reject(-1) : resolve(-1);
                })
        });
    }

    /**
     * Complete the status of the event.
     * Update in Habitica too to score points!
     * @param {ObjectID} _id MongoDB ObjectID of the Calbit
     * @param {Boolean} status Completion status of the event
     */
    updateCompletion(_id, status) {
        return new Promise((resolve, reject) => {
            Calbit.findOneAndUpdate({ _id },
                {
                    completed: {
                        status,
                        date: new Date()
                    }
                },
                { new: true } // Return the new, updated document
            )
                .then(calbit => {
                    let direction = status ? "up" : "down";
                    this.habiticaController
                        .scoreTask(calbit.habiticaID, direction)
                        .then(axiosResponse => {
                            let axiosData = axiosResponse.data; // axios data obj
                            if (axiosData.success) {
                                resolve({
                                    stats: this.habiticaController.processStats(axiosData.data, true), // send back the profile!
                                    summary: calbit.summary
                                });
                            }
                        })
                        .catch(err => {
                            let errObj = {};

                            if (err.code == "ECONNABORTED") {
                                errObj = {
                                    status: 504,
                                    message: "Seems like the Habitica server is down. Please try agian in a short while."
                                }
                            } else {
                                errObj = {
                                    status: (!err.response || !err.response.status)
                                        ? 400
                                        : err.response.status,
                                    message: (!err.response || !err.response.status)
                                        ? "Could not delete from Habitica"
                                        : err.response.data
                                }
                            }
                            reject(errObj);
                        });
                })
                .catch(err => {
                    reject(err);
                })
        })
    }
}


module.exports = CalbitController;