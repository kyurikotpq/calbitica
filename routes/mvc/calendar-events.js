var mongoose = require('mongoose');
var schema = mongoose.Schema;
var eventSchema = new schema();
var EventModel;

var database = {
    connect: function() {
        mongoose.connect(process.env.MONGO_URI,

        {useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true},

        function(err){
            if(err == null) {
            eventSchema = {
                title: String,
                start: String,
                end: String,
                color: String
            };
                EventModel = mongoose.model('calendar', eventSchema);
            } else {
                console.log("Error connecting to MongoDB, collection of Calendar Events");
            }
        })
    },
    getAllEvents: function(callback) {
        EventModel.find({}, callback);
    },
    saveEvent: function(title, start, end, color, callback) {
        var newEvent = new EventModel({
            title: title,
            start: start,
            end: end,
            color: color
        });
        newEvent.save(callback);
    },
    updateEventById: function(id, title, start, end, color, callback) {
        EventModel.updateMany({_id:id},{title:title,start:start, end:end, color:color}, callback);
    },
    deleteEventById: function(id, callback) {
        EventModel.deleteMany({_id: id}, callback);
    }
};

module.exports = database;