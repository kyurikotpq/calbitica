const axiosInstance = require('../config/h-axios-setup');
const User = require('../models/user').model;
const crypt = require('../util/crypt');
const saveToMongo = require('./habitica-import');

function saveSettings(body) {
    const apiKey = body.apiKey,
        userID = body.userID,
        calbitAPI = body.calbitAPI;

    let data = {};
    if (userID) data.habiticaID = userID;
    if (apiKey) data.habiticaAPI = crypt.encrypt(apiKey);

    // Update the Habitica details in MongoDB
    return User.updateOne(
        { calbitAPI },
        data,
        { new: true } // return the updated document
    );
}

function getAll(type = null) {
    let url = 'https://habitica.com/api/v3/tasks/user';
    url += (!type) ? '' : `?type=${type}`

    return axiosInstance.get(url);
}

function getProfile(userID) {
    let url = `https://habitica.com/api/v3/members/${userID}`;
    return axiosInstance.get(url);
    // https://habitica.com/api/v3/members/:memberId
}

function saveToHabitica(data) {
    let url = `https://habitica.com/api/v3/tasks/user`;
    return axiosInstance.post(url, data);
    // https://habitica.com/api/v3/tasks/user
}

/**
 * Imports Habitica things as Calbits
 * where you can set time and day to 
 * do the Habitica task/habit/daily
 * 
 * By default: it's a dump that needs to be scheduled.
 */
function importToMongo(type = null, userID) {
    return new Promise((resolve, reject) => {
        getAll(type)
            .then(response => {
                let d = response.data;
                if (response.status == 200 && d) {
                    let habiticaItems = d.data;

                    let saveToMongoResults = habiticaItems.map(item => {
                        return saveToMongo(item, userID);
                    });

                    Promise.all(saveToMongoResults).then((arr) => {
                        let success = arr.filter(resultCode => resultCode == 1).length;
                        let fail = arr.filter(resultCode => resultCode == -1).length;
                        resolve({ success, fail });
                    });
                } else
                    reject("Something went wrong");
            }).catch(error => {
                // TODO: simplify this
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log(error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                }
                reject("Something went wrong");
            })
    });
}

let habiticaController = {
    saveSettings,
    getAll,
    getProfile,
    importToMongo,
    saveToHabitica
}

module.exports = habiticaController;