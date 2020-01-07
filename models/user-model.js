/**
 * Model for the Calbitica User
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define fields and data types
let fields = {
    googleIDs: [String],
    habiticaID: String,
    habiticaAPI: String,
    refresh_tokens: [String],
    profile: {
        displayNames: [String],
        thumbnails: [String],
    },
};

// Create a new Schema (data structure)
const userSchema = new Schema(fields, { typeKey: '$type' });

// create the model
const User = mongoose.model('user', userSchema);

// export model for use
module.exports = { model: User, fields: Object.keys(fields) };;