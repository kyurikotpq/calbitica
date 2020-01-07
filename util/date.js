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

function halfHourIntervals() {
    let intervals = [];
    for(let i = 0; i < 24; i++) {
        let start = ("0" + i).slice(-2);
        intervals.push(`${start}:00`);
        intervals.push(`${start}:30`);
    }
    return intervals;
}

module.exports = { getMs, add, sub, halfHourIntervals }