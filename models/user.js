/**
 * Model for the Calbitica User
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a new Schema (data structure)
const userSchema = new Schema({
    googleIDs: [String],
    habiticaID: String,
    habiticaAPI: String,
    refresh_tokens: [String],
    profile: {
        displayNames: [String],
        thumbnails: [String],
    }
});

// create the model
const User = mongoose.model('user', userSchema);

// export model for use
module.exports = User;