const Calbit = require('../models/calbit').model;

function getAllEvents() {
    return new Promise((resolve, reject) => {
        Calbit.find({})
            .then(results => {
                resolve(
                    results.map(item => {
                        return {
                            title: item.summary,
                            start: item.start.dateTime ? item.start.dateTime : item.start.date,
                            end: item.end.dateTime ? item.end.dateTime : item.end.date,
                            allDay: item.start.date != undefined, 
                            color: item.color,
                            _id: item._id
                        }
                    })
                );
            }).catch(err => {
                console.error(err);
                reject(err);
            });
    });
}

function saveEvent(body) {
    let data = prepDataForMongo(body);
    return new Calbit(data).save();
}

function updateEventById(id, body) {
    let data = prepDataForMongo(body);
    return Calbit.findByIdAndUpdate(id, data);
}

function prepDataForMongo(body) {
    let start = {},
        end = {};

    // why is allDay a string??
    if (body.allDay == 'true') {
        // save inside 
        start.date = body.start;
        end.date = body.end;
    } else {
        start.dateTime = body.start;
        end.dateTime = body.end;
    }

    let data = {
        summary: body.title,
        start,
        end,
        color: body.color
    }
    return data;
}

function deleteEventById(id) {
    return Calbit.findByIdAndDelete(id);
}

let calbitController = {
    getAllEvents,
    saveEvent,
    updateEventById,
    deleteEventById
};

module.exports = calbitController;