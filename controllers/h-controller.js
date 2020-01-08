/**
 * In charge of interfacing with the Habitica API
 * AND saving Habitica settings to our MongoDB
 */
const axiosInstance = require('../config/h-axios-setup');
const User = require('../models/user-model').model;
const Crypt = require('../util/crypt');

/**
 * Get INCOMPLETE items in Habitica
 * 
 * @param {String} type 
 */
function getIncomplete(type = null) {
    let url = 'https://habitica.com/api/v3/tasks/user';
    url += (!type) ? '' : `?type=${type}`

    return axiosInstance.get(url);
}

/**
 * Get completed items in Habitica
 */
function getComplete() {
    let url = 'https://habitica.com/api/v3/tasks/user?type=completedTodos';
    return axiosInstance.get(url);
}

/**
 * Create the specified task in Habitica
 * @param {Object} data 
 */
function saveToHabitica(data) {
    let url = `https://habitica.com/api/v3/tasks/user`;
    return axiosInstance.post(url, data);
}

/**
 * Update the specified task in Habitica
 * @param {HabiticaID} taskID 
 * @param {Object} data 
 */
function updateInHabitica(taskID, data) {
    let url = `https://habitica.com/api/v3/tasks/${taskID}`;
    return axiosInstance.put(url, data);
}

/**
 * Delete the specified task from Habitica
 * @param {HabiticaID} taskID 
 */
function deleteInHabitica(taskID) {
    let url = `https://habitica.com/api/v3/tasks/${taskID}`;
    return axiosInstance.delete(url);
}

/**
 * 
 * @param {HabiticaID} taskID 
 * @param {String} direction "up" or "down"
 */
function scoreTask(taskID, direction) {
    let url = `https://habitica.com/api/v3/tasks/${taskID}/score/${direction}`;
    return axiosInstance.post(url);
}

/**
 * Accept/Reject the current quest invite
 * @param {Boolean} accept 
 * @param {HabiticaID} groupID 
 */
function respondToQuest(accept, groupID) {
    let acceptText = (accept) ? 'accept' : 'reject';
    let url = `https://habitica.com/api/v3/groups/${groupID}/quests/${acceptText}`;

    return new Promise((resolve, reject) => {
        axiosInstance.post(url)
            .then(result => {
                let data = result.data; // this is the axios object
                resolve(data.data) // this is the habitica quest object
            })
            .catch(err => {
                reject({
                    status: err.response.status,
                    message: err.response.data
                });
            });
    })
}

/**
 * Toggles the sleep key under user preference (true/false)
 */
function toggleSleep() {
    let url = `https://habitica.com/api/v3/user/sleep`;
    return new Promise((resolve, reject) => {
        axiosInstance.post(url)
            .then(result => {
                let data = result.data; // this is the axios object

                // this is the habitica sleep status
                let sleep = data.data;
                let message = (sleep) ? "You're resting in the Inn. Damage is paused."
                    : "You've left the Inn. Damage is resumed.";
                resolve({ sleep, message });
            })
            .catch(err => {
                reject({
                    status: err.response.status,
                    message: err.response.data
                });
            });
    })
}


/**
 * Get the user's profile from Habitica.
 * Includes their name and stats, and party stuff (for quests).
 * @todo ADD QUESTS 
 * 
 * @param {String} userID (Habitica userID)
 */
function getProfile(userID) {
    let url = `https://habitica.com/api/v3/members/${userID}`;
    return new Promise((resolve, reject) => {
        axiosInstance.get(url)
            .then(result => {
                let data = result.data; // this is the axios object
                if (data.success) {
                    let allInfo = data.data;

                    // Do some cleaning
                    let stats = processStats(allInfo.stats);

                    resolve({
                        profile: allInfo.profile, // display name
                        stats, // hp, exp, mp, gp
                        preferences: allInfo.preferences, // sleep, etc.
                        party: allInfo.party // party id and quests
                    });
                } else {
                    reject({
                        status: 400,
                        message: "Could not get Habitica API Key"
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
}

function processStats(stats, scoreTask = false) {
    let cleanedStats = {
        lvl: stats.lvl,
        class: stats.class.charAt(0).toUpperCase() + stats.class.substring(1),
        hp: Math.round(stats.hp),
        exp: Math.round(stats.exp),
        mp: Math.round(stats.mp),
        gp: Math.round(stats.gp),
    };

    if(!scoreTask) {
        cleanedStats.maxHealth = Math.round(stats.maxHealth);
        cleanedStats.toNextLevel = Math.round(stats.toNextLevel);
        cleanedStats.maxMP = Math.round(stats.maxMP);
    }
    return cleanedStats;
}



/**
 * Save User's Habitica API Key and/or User ID
 * to our MongoDB
 * @param {Object} body 
 */
function saveSettings(body) {
    const apiKey = body.apiKey,
        habiticaID = body.hUserID,
        _id = body.decodedJWT.sub;

    let data = {};
    if (habiticaID) data.habiticaID = habiticaID;
    if (apiKey) data.habiticaAPI = Crypt.encrypt(apiKey);

    // Update the Habitica details in MongoDB
    return User.findOneAndUpdate(
        { _id },
        data,
        { new: true } // return the updated document
    );
}

// function importToMongo(type = null, userID) {
//     return new Promise((resolve, reject) => {
//         getComplete()
//             .then(axiosCompleteResp => {
//                 let completed = axiosCompleteResp.data;

//                 if (completed == undefined || axiosCompleteResp.status != 200) {
//                     reject({
//                         status: axiosCompleteResp.status,
//                         message: "Could not get completed Habitica items"
//                     });
//                 }

//                 getIncomplete(type)
//                     .then(response => {
//                         let d = response.data;
//                         if (d == undefined || response.status != 200) {
//                             reject({
//                                 status: response.status,
//                                 message: "Could not get incomplete Habitica items"
//                             });
//                         }

//                         // Don't support rewards for now
//                         let incomplete = d.data.filter(item => {
//                             return item.type != "reward"
//                                 && item.id != null // deleted items in Habitica have null ID
//                         });

//                         habiticaImporter(incomplete.concat(completed.data), userID)
//                             .then((result) => { resolve(result); })
//                             .catch(err => {
//                                 reject({ status: 500, message: err })
//                             });

//                     }).catch(err => {
//                         if (error.response) {
//                             reject({ status: err.response.status, message: err.message });
//                         } else {
//                             console.log('Error', error.message);
//                             reject({ status: 500, message: err.message });
//                         }
//                     })
//             }).catch(error => {
//                 if (error.response) {
//                     reject({ status: err.response.status, message: err.message });
//                 } else {
//                     console.log('Error', error.message);
//                     reject({ status: 500, message: err.message });
//                 }
//             })
//     });
// }

let habiticaController = {
    saveSettings,
    getIncomplete,
    getComplete,
    getProfile,
    scoreTask,
    respondToQuest,
    toggleSleep,
    processStats,

    // importToMongo,
    saveToHabitica,
    updateInHabitica,
    deleteInHabitica,
}

module.exports = habiticaController;