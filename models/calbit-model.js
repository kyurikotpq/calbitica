/**
 * - Model for keeping track of which GCal events 
 * have been synced with Habitica (and whether they've been checked off)
 * - Model for keeping track of Habitica's H,D,TDs
 * - Model for keeping track of brain dumps
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define fields and data types
const fields = {
    userID: String, // MongoDB ID
    calendarID: String, // MongoDB Calendar ID
    googleID: String, // Google Event ID, can be null - only exists on Habitica
    
    // habiticaID CANNOT be null, cos they're gonna get imported to Habitica anyway
    // UNLESS: this item is a brain dump
    habiticaID: String,
    habiticaType: String, // Habit, Task, Daily
    isDump: Boolean, // true if brain dump or not assigned date time yet
    display: Boolean, // false if you don't want it displayed
    
    created: Date, // when was this first imported from GCal?
    summary: String, // Title
    description: String, // description
    location: String,
    start: { // date and time this is happening
        date: Date, // yyyy-mm-dd if all-day event
        dateTime: Date,
        timeZone: String
    },
    end: { // date and time this is ending
        date: Date, // yyyy-mm-dd if all-day event
        dateTime: Date, 
        timeZone: String
    },
    
    color: String,
    completed: {
        status: Boolean,
        date: Date
    },
    
    /** 
     * REMINDER OBJECT
     * {
     *      $type: String ['email', 'popup'],
     *      minutes: Number,
     * }
     * 
     */
    reminders: Array,

    modifications: Array // Array of dates
    // tags: Array
    // repeat: follow the rules
};

// Create new schema
const calbitSchema = new Schema(fields);

// create new model
const Calbit = mongoose.model('calbit', calbitSchema);

// export model for use
module.exports = { model: Calbit, fields: Object.keys(fields) };