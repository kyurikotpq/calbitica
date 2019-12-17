const axios = require('axios');
const habiticaConfig = require('./h-axios-config')

const instance = axios.create(habiticaConfig);

module.exports = instance;