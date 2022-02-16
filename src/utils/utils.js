function isEmpty (str) {
    return !str || str.length === 0 || !str.trim()
}

function getRandom (arr) {
    const index = Math.floor(Math.random() * arr.length)
    return arr[index]
}

function getKeyValuePair (inputString, delimiter) {
    const indexDelimiter = inputString.indexOf(delimiter)
    if (indexDelimiter > 0) {
        const keyValue =
                    [inputString.slice(0, indexDelimiter),
                        inputString.slice(indexDelimiter + 1)]
        return keyValue
    } else {
        console.log(`Splitting the string [${inputString}] by a delimiter '${delimiter}' was not successful! So it is skipped!`)
        return null
    }
}

function getAllChannelUsers (channel, expceptUserId = '') {
    return channel.members.filter(m => m.id !== expceptUserId && m.user.bot === false).array()
}

module.exports =
{
    isEmpty,
    getRandom,
    getKeyValuePair,
    getAllChannelUsers
}
