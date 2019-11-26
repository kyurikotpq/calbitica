/**
 * Model for the Calbitica User
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a new Schema (data structure)
const userSchema = new Schema({
    displayName: String,
    googleID: [String],
    thumbnail: [String],
    habiticaID: String,
    habiticaAPI: String,
    refresh_token: [String]
});

// create the model
const User = mongoose.model('user', userSchema);

// export model for use
module.exports = User;