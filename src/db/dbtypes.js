const requiredString = {
    type: String,
    required: true
}

const requiredDate = {
    type: Date,
    required: true
}

const number = {
    type: Number,
    required: true,
    validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
    }
}

module.exports = {
    requiredString,
    requiredDate,
    number
}
