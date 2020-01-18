/**
 * Handles the CRUD of calbits in MongoDB
 */
const Calbit = require('../models/calbit-model').model;
const habiticaController = require('./h-controller');
const gcalController = require('./gcal-controller');

const TransformCalbitUtil = require('../util/transform-calbit');

/**
 * Gets the user's calbits.
 * 
 * If isDump is null, dump & non-dump items 
 * will be returned (return all)
 * 
 * @param {ObjectID} userID 
 * @param {Boolean|null} isDump Get only dump items
 * @param {Boolean|null} displayOnly Get only displayed items
 * @param {Object|null} others Other search criteria
 */
function getAllCalbits(userID, isDump = null, displayOnly = null, others = null) {
    let searchCriteria = { userID };

    if (others) {
        for (let k in others)
            searchCriteria[k] = others[k];
    }

    // string comparison is required to protect against non-Boolean-castable values
    // thus, 'null' or 'lmao' are treated as false values
    if (isDump != null)
        searchCriteria.isDump = `${isDump}` == 'true';

    if (displayOnly != null)
        searchCriteria.display = `${displayOnly}` == 'true';

    let fields = "_id summary description isDump calendarID googleID "
        + "completed start end location";

    return Calbit.find(searchCriteria, fields);
}

function createInMongo(data) {
    return new Promise((resolve, reject) => {
        let code = -1;
        new Calbit(data).save()
            .then(result => code = 1)
            .catch(err => { })
            .finally(() => resolve(code))
    })
}

/**
 * 
 * @param {Request} body 
 * @param {ObjectID} userID MongoDB ID
 * @param {String} dataFrom 
 */
function createCalbit(body, userID, dataFrom) {
    let data = TransformCalbitUtil.prepData(body, userID, dataFrom);

    return new Promise((resolve, reject) => {
        if (dataFrom == 'mvc') {
            gcalController.saveEvent(body.calendarID, data)
                .then((gcalEvent) => {
                    let gcalData = gcalEvent.data;
                    data.googleID = gcalData.id;
                    data.created = gcalData.created;

                    createInMongo(data)
                        .then(resultCode => {
                            if (resultCode == -1) {
                                (dataFrom == 'mvc') ? reject(resultCode) : resolve(resultCode);
                                return;
                            }
                            resolve(resultCode);
                        })
                })
                .catch(err => {
                    (dataFrom == 'mvc') ? reject(-1) : resolve(-1);
                });
        } else {
            createInMongo(data)
                .then(resultCode => {
                    if (resultCode == -1) {
                        (dataFrom == 'mvc') ? reject(resultCode) : resolve(resultCode);
                        return;
                    }
                    resolve(resultCode);
                })
        }
    });
}

function updateInMongo(_id, data, mvc = false) {
    return new Promise((resolve, reject) => {
        let code = -1, updatedCalbit = null;
        Calbit.findOneAndUpdate({ _id }, data, { new: true })
            .then(calbit => {
                code = 1;
                updatedCalbit = calbit;
            })
            .catch(err => { })
            .finally(() => {
                (mvc && code != -1) ? resolve(updatedCalbit) : resolve(code);
            })
    })
}

function updateCalbit(_id, body, dataFrom) {
    let data = TransformCalbitUtil.prepData(body, null, dataFrom);

    return new Promise((resolve, reject) => {
        if (dataFrom == 'mvc') {
            gcalController.saveEvent(body.calendarID, data, body.googleID)
                .then((gcalEvent) => {
                    updateInMongo(_id, data, true)
                        .then(calbitOrResultCode => {
                            if (calbitOrResultCode == -1) {
                                reject(calbitOrResultCode);
                                return;
                            }

                            // update in Habitica
                            let calbit = calbitOrResultCode;
                            habiticaController.updateInHabitica(calbit.habiticaID,
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
                });
        } else {
            updateInMongo(_id, data)
                .then(resultCode => {
                    if (resultCode == -1) {
                        (dataFrom == 'mvc') ? reject(resultCode) : resolve(resultCode);
                        return;
                    }
                    resolve(resultCode);
                })
        }
    });
}

function deleteInMongo(_id, mvc = false) {
    return new Promise((resolve, reject) => {
        // Delete from habitica AND google calendar
        Calbit.findOneAndDelete({ _id })
            .then(deletedCalbit => {
                gcalController.deleteEvent(deletedCalbit.calendarID, deletedCalbit.googleID)
                    .then((gcalEvent) => {
                        habiticaController.deleteInHabitica(deletedCalbit.habiticaID)
                            .then(axiosResponse => {
                                (!mvc) ? resolve(1) : resolve(deletedCalbit);
                            })
                            .catch(err => {
                                reject({
                                    status: err.response.status,
                                    message: err.response.data
                                });
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

// Update in Habitica too to score points!
function updateCompletion(_id, status) {
    return new Promise((resolve, reject) => {
        Calbit.findOneAndUpdate({ _id },
            {
                completed: {
                    status,
                    date: new Date()
                }
            },
            { new: true }
        )
            .then(calbit => {
                let direction = status ? "up" : "down";
                habiticaController.scoreTask(calbit.habiticaID, direction)
                    .then(axiosResponse => {
                        let axiosData = axiosResponse.data; // axios data obj
                        if (axiosData.success) {
                            resolve({
                                stats: habiticaController.processStats(axiosData.data, true), // send back the profile!
                                summary: calbit.summary
                            });
                        }
                    })
                    .catch(err => {
                        reject({
                            status: err.response.status,
                            message: err.response.data
                        });
                    });
            })
            .catch(err => {
                reject(err);
            })
    })
}


let calbitController = {
    getAllCalbits,
    createCalbit,
    updateCalbit,
    deleteInMongo,
    updateCompletion
};

module.exports = calbitController;