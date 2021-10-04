function isEmpty(str) {
    return !str || str.length === 0 || !str.trim();
}

function getRandom(arr) {
    const index = Math.floor(Math.random() * arr.length)
    return arr[index]
}

module.exports =
{
    isEmpty,
    getRandom
}