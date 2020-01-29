/**
 * Data transformation methods
 */


/**
 * Convert data from MVC/Android/iOS (via API call)
 * for storage as Calbit into MongoDB
 * @param {Object} body 
 * @param {ObjectID} userID 
 */
function prepMVCDataForMongo(body, userID = null) {
    let start = {},
        end = {},
        reminders = [];

    // why is allDay a string?? JSON encoding?
    let allDay = (body.allDay + "") == "true";
    let dateKey = (allDay) ? "date" : "dateTime";
    start[dateKey] = body.start;
    end[dateKey] = body.end;

    let acceptedDumpTypes = ["true", "false"];

    let data = {
        habiticaType: "todo", // add support for habit and daily in future
        start,
        end,
        calendarID: body.calendarID,
        // future: add support for tags
        // tags: Array
        // todo: HANDLE DAILIES, REPETITION!
        // new property?
    }

    if (body.description)
        data.description = body.description;

    if (body.title)
        data.summary = body.title;

    if (body.isDump && acceptedDumpTypes.includes(`${body.isDump}`))
        data.isDump = body.isDump;

    if (body.completed != undefined) {
        data.completed = { status: body.completed };

        if ((body.completed + "") == "true")
            data.completed.date = new Date();
    }

    if (body.display)
        data.display = (body.display + "") == "true";

    if (body.reminders != undefined) {
        reminders.push(body.reminders);
        data.reminders = reminders;
    }

    // Creating calbit
    if (userID) {
        data.userID = userID;
        data.googleID = body.googleID;
        data.habiticaID = body.habiticaID;
        data.completed = { status: false };
    }

    return data;
}

/**
 * Convert Habitica Item for
 * storage as Calbit in MongoDB
 * @param {HabiticaItem} item 
 * @param {ObjectID} userID 
 */
function prepHDataForMongo(item, userID = null) {
    let data = {
        summary: item.text, // title
        completed: {
            status: item.completed || false,
        }

        // future: add support for tags
        // tags: Array
        // todo: HANDLE DAILIES, REPETITION!
        // new property?
    };

    if (item.description)
        data.description = item.notes;

    if (item.completed != undefined)
        data.completed = { status: item.completed, date: item.updatedAt };

    // Creating calbit
    if (userID) {
        data.userID = userID;
        data.isDump = true;
        data.habiticaID = item.id;
        data.habiticaType = item.type; // Habit, Task, Daily
    }

    return data;
}

/**
 * Not done ya
 * @param {Event} item 
 * @param {ObjectID} userID 
 */
function prepGCalDataForMongo(item, userID = null) {
    console.log("PREPPING FROM GCAL DATA ");
    let data = {
        summary: item.summary,
        start: item.start,
        end: item.end,

        // future: add support for tags
        // tags: Array
        // todo: HANDLE DAILIES, REPETITION!
        // new property?
    };

    if (item.description)
        data.description = item.notes;

    // Creating calbit
    if (userID) {
        data.userID = userID;
        data.isDump = false;
        data.googleID = item.id;
        data.calendarID = item.calendarID;
        data.habiticaID = item.habiticaID;
        data.habiticaType = item.habiticaType; // Habit, Task, Daily
        data.completed = { status: false };
        data.display = true;
        data.created = item.created;
    }

    return data;
}

function prepData(body, userID, dataFrom) {
    let data = null;

    switch (dataFrom) {
        case 'mvc':
            data = prepMVCDataForMongo(body, userID);
            break;
        case 'habitica':
            data = prepHDataForMongo(body, userID);
            break;
        case 'gcal':
        default:
            data = prepGCalDataForMongo(body, userID);
            break;
    }

    return data;
}

let TransformCalbitUtil = {
    prepHDataForMongo,
    prepMVCDataForMongo,
    prepGCalDataForMongo,
    prepData,
}

module.exports = TransformCalbitUtil;