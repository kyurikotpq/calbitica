/**
 * - Model for keeping track of which GCal events 
 * have been synced with Habitica (and whether they've been checked off)
 * - Model for keeping track of Habitica's H,D,TDs
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create new schema
const calbitSchema = new Schema({
    userID: String, // MongoDB ID
    googleID: String, // can be null - only exists on Habitica
    habiticaID: String, // CANNOT be null, cos they're gonna get imported to Habitica anyway
    title: String,
    description: String,
    datetime: Date, // date and time this is happening
    
    completed: Boolean,
});

// create new model
const Calbit = mongoose.model('user', calbitSchema);

// export model for use
module.exports = Calbit;