/**
 * Model for keeping track of which GCal calendars 
 * belong to which user
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create new schema
const fields = {
    userID: String, // MongoDB ID
    googleID: String,
    summary: String,
    description: String,
    defaultReminders: Array,
    /**
     * Sample Structure, FYI
     * [
            {
                method: String,
                minutes: Number
            }
        ]
     */
    notificationSettings: {
        notifications: [
            {
                $type: String,
                method: String
            }
        ]
    },
    sync: Boolean,
    nextSyncToken: {
        calendars: {
            token: String,
            retrieved: Date,
        },
        events: {
            token: String,
            retrieved: Date,
        }
    }
};

const calendarSchema = new Schema(fields);

// create new model
const Calendar = mongoose.model('calendar', calendarSchema);

// export model for use
module.exports = { model: Calendar, fields: Object.keys(fields) };