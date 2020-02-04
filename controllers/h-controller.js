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
 * Score (complete) a task in Habitica
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


/**
 * Compiles the stats (rounded)
 * into an object for ease of display
 * 
 * @param {Object} stats Habitica User Stats
 * @param {Boolean} scoreTask Whether you're calling
 * this function to score a task, or to display the stats
 */
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
 * Save User's Habitica API Key
 * and/or User ID to our MongoDB
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


/**
 * Compile functions for export
 */
let habiticaController = {
    // Axios calls
    getIncomplete,
    getComplete,
    getProfile,
    scoreTask,
    respondToQuest,
    saveToHabitica,
    updateInHabitica,
    deleteInHabitica,
    toggleSleep,

    // Local/MongoDB calls
    processStats,
    saveSettings,
}

module.exports = habiticaController;