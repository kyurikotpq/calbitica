const Calbit = require('../models/calbit').model;

/**
 * Save the Habitica item to MongoDB
 * @param {Calbit} item 
 * @param {String} userID 
 */
function saveToMongo(item, userID) {
    return new Promise((resolve, reject) => {
        let data = {
            userID, // MongoDB User ID
            habiticaID: item.id,
            habiticaType: item.type, // Habit, Task, Daily
            isDump: true,

            summary: item.text, // title
            description: item.notes,
            location: '', // default empty/null

            completed: item.completed,

            // future: add support for tags
            // tags: Array
        };

        // todo: HANDLE DAILIES, REPETITION!
        // new property?

        // see if calbit has been created before
        Calbit.find({ habiticaID: item.id })
            .then(results => {
                if (results.length == 1) {
                    // create before - just update fields
                    results[0].summary = item.text;
                    results[0].habiticaType = item.type;
                    results[0].description = item.notes;
                    results[0].save();

                    resolve(1);
                } else if (results.length > 1) {
                    // Got error
                    console.error("Duplicate habitica items found");
                    reject(-1);
                } else {
                    // create new collection
                    new Calbit(data).save()
                        .then(calbit => {
                            console.log("Created calbit", calbit)
                            resolve(1);
                        })
                        .catch(err => {
                            console.error(err);
                            reject(-1);
                        });
                }
            })
    })

}

module.exports = saveToMongo;