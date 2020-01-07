/**
 * Handles the comparison of habitica VS calbits
 * and does CRUD as appropriate.
 * 
 * By default: it's a dump that needs to be scheduled.
 */

const calbitController = require('./calbit-controller');
const habiticaController = require('./h-controller');

function compareItems(habiticaItems, calbits, userID) {
    return new Promise((resolve, reject) => {
        let updatedPromises = [];
        let notInHabiticaArr = calbits.filter(c => {
            let hItem = habiticaItems.find(item => item.id == c.habiticaID);
            if (hItem != undefined) {
                // update mongo
                updatedPromises.push(calbitController.updateCalbit(c._id, hItem, 'habitica'))
            }

            // else - Habitica item no longer exists, delete it
            return hItem == undefined;
        });

        let deletedPromises = [];
        notInHabiticaArr.forEach(c => {
            deletedPromises.push(calbitController.deleteInMongo(c._id));
        });

        let createdPromises = [];
        habiticaItems.forEach(item => {
            let existsInMongo = calbits.find(c => item.id == c.habiticaID);
            if (!existsInMongo)
                createdPromises.push(calbitController.createCalbit(item, userID, 'habitica'))
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
 * ROUTE Entry point for H -> Mongo.
 * Habitica is treated as the single source of truth.
 * @param {*} type 
 * @param {*} userID 
 */
function hImporter(type = null, userID) {
    return new Promise((resolve, reject) => {
        habiticaController.getComplete()
            .then(axiosCompleteResp => {
                let completed = axiosCompleteResp.data;

                if (completed == undefined || axiosCompleteResp.status != 200) {
                    reject({
                        status: axiosCompleteResp.status,
                        message: "Could not get completed Habitica items"
                    });
                }

                habiticaController.getIncomplete(type)
                    .then(response => {
                        let d = response.data;
                        if (d == undefined || response.status != 200) {
                            reject({
                                status: response.status,
                                message: "Could not get incomplete Habitica items"
                            });
                        }

                        // Don't support rewards for now
                        let incomplete = d.data.filter(item => {
                            return item.type != "reward"
                                && item.id != null // deleted items in Habitica have null ID
                        });


                        calbitController.getAllCalbits(userID, null)
                            .then(calbits => {
                                compareItems(incomplete.concat(completed.data), calbits, userID)
                                    .then((result) => { resolve(result); })
                                    .catch(err => {
                                        reject({ status: 500, message: err })
                                    })
                            })
                            .catch(err => {
                                reject(err);
                            });

                    }).catch(err => {
                        if (error.response) {
                            reject({ status: err.response.status, message: err.message });
                        } else {
                            console.log('Error', error.message);
                            reject({ status: 500, message: err.message });
                        }
                    })
            }).catch(error => {
                if (error.response) {
                    reject({ status: err.response.status, message: err.message });
                } else {
                    console.log('Error', error.message);
                    reject({ status: 500, message: err.message });
                }
            })
    })
}

module.exports = hImporter;