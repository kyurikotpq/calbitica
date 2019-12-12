const axios = require('axios');
const User = require('../models/user').model;
const crypt = require('../util/crypt');

let habitica = {
    saveSettings(body) {
        const apiKey = body.apiKey,
              userID = body.userID,
              calbitAPI = body.calbitAPI;
        
        let data = {};
        if (userID) data.habiticaID = userID;
        if (apiKey) data.habiticaAPI = crypt.encrypt(apiKey);
        
        // Update the Habitica details in MongoDB
        return User.findOneAndUpdate(
            { calbitAPI }, 
            data, 
            { new: true } // return the updated document
        );
    },
    getAll(apiKey) {
        // axios.post()

    },
    getProfile() {
        // https://habitica.com/api/v3/members/:memberId
    },

}

module.exports = habitica;