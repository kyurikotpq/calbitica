// Needs to be let since we're modifying it later
let axiosConfig = {
    baseURL: 'https://habitica.com/api/v3/',
    timeout: 10000,
    headers: {
        'x-client': '10213571-a212-4ca9-816a-0d05c79a04eb-Calbitica',
    }
};

module.exports = axiosConfig;