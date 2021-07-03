const momentTimezone = require('moment-timezone')

function now() {
    return momentTimezone()
}

function parseDate(date, time, clockType, timeZone = "Europe/Sofia") {
    const parsedDate = momentTimezone
        .tz(`${date} ${time} ${clockType}`,
            'YYYY-MM-DD HH:mm A',
            timeZone)
    //.utc()
    return parsedDate.toDate()
}

function getDateInTimeZone(date, timeZone = "Europe/Sofia") {
    return momentTimezone(date)
        .tz(timeZone)
        .format('YYYY-MM-DD HH:mm A')
}

function getDateAccordingToCurrentTime(targetDate) {

    let date = momentTimezone(targetDate)
    let currentTime = now()

    if (date.isBefore(currentTime)) {
        currentTime.add(1, 'minutes')
        date = currentTime
    }

    return date.toDate()
}

function getDatePlusOneHour(date) {
    let momentDate = momentTimezone(date).subtract(1, 'hours')
    return getDateAccordingToCurrentTime(momentDate)
}

function getDatePlusOneDay(date) {
    let momentDate = momentTimezone(date).subtract(1, 'days')
    return getDateAccordingToCurrentTime(momentDate)
}

function isValidDate(inputDate) {
    return momentTimezone(inputDate).isValid()
}

function isFutureDate(inputDate) {
    return momentTimezone(inputDate).isAfter(now())
}

module.exports =
{
    parseDate,
    isValidDate,
    isFutureDate,
    getDatePlusOneDay,
    getDatePlusOneHour,
    getDateAccordingToCurrentTime,
    getDateInTimeZone
}