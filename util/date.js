const numMsPerHour = 60 * 60 * 1000;
const numMsPerDay = 24 * numMsPerHour;
const numMsPerWeek = 7 * numMsPerDay;
const numMsPerMonth = 30 * numMsPerDay;

/**
 * Get number of milliseconds for the specified
 * type and amount of 'type'
 * @param {String} type 
 * @param {Integer} amount 
 */
function getMs(type, amount) {
    let numMs = 0;
    switch (type) {
        case "h": numMs = amount * numMsPerHour; break;
        case "d": numMs = amount * numMsPerDay; break;
        case "w": numMs = amount * numMsPerWeek; break;
        case "m": numMs = amount * numMsPerMonth; break;
    }
    return numMs;
}

/**
 * Add "amount" of hours/days/months to the
 * supplied date
 * 
 * @param {Date|String} date 
 * @param {String} type 
 * @param {Integer} amount
 * 
 * @return {Date} newDate
 */
function add(date, type, amount) {
    let newDate = new Date();

    if (typeof (date) == "string")
        date = new Date(date);

    let numMsToAdd = getMs(type, amount);
    return new Date(newDate.setTime(date.getTime() + numMsToAdd));
}

/**
 * Minus/Sub "amount" of hours/days/months to the
 * supplied date
 * 
 * @param {Date|String} date 
 * @param {String} type 
 * @param {Integer} amount
 * 
 * @return {Date} newDate
 */
function sub(date, type, amount) {
    let newDate = new Date();

    if (typeof (date) == "string")
        date = new Date(date);

    let numMsToSub = getMs(type, amount);
    return new Date(newDate.setTime(date.getTime() - numMsToSub));
}

/**
 * Generate 30-min intervals for
 * a dropdown list
 */
function halfHourIntervals() {
    let intervals = [];
    for (let i = 0; i < 24; i++) {
        let start = ("0" + i).slice(-2);
        intervals.push(`${start}:00`);
        intervals.push(`${start}:30`);
    }
    return intervals;
}

/**
 * Calbit-specific helper function
 * @param {*} startDateObj 
 * @param {*} endDateObj 
 * @returns boolean
 */
function isAllDay(startDateObj, endDateObj) {
    let allDay = startDateObj.date != undefined;

    let start = new Date(allDay ? startDateObj.date : startDateObj.dateTime),
        end = new Date(allDay ? endDateObj.date : endDateObj.dateTime);

    return allDay || start.getDate() != end.getDate();
}

/**
 * Calculate the amount of milliseconds between now and the specified date.
 * Returns negative values if the time has passed.
 * 
 * @param {Number} timeInDateMs Milliseconds from a Date.getTime()
 */
function timeFromNow(timeInDateMs) {
    let now = new Date().getTime()
    return timeInDateMs - now
}

let DateUtil = { 
    getMs, add, sub, 
    halfHourIntervals, 
    isAllDay,
    timeFromNow
};

module.exports = DateUtil