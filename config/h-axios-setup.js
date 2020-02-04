const axios = require('axios');
const habiticaConfig = require('./h-axios-config')

// Create an axios instance for interfacing
// with the Habitica API
const instance = axios.create(habiticaConfig);

module.exports = instance;