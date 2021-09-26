const { Schema, model } = require('mongoose')

const date = new Date().toLocaleString()

const PrivateMessages = new Schema({
    messageID: { type: Number, required: true, default: 0, },
    userID: { type: String, required: true,},
    content: { type: String, required: true,},
    likes: { type: Number, required: true, default: 0},
    date: {type: Date, default: Date.now()},
    dateNormal: { type: String, default: date },
})

module.exports = model('PrivateMessages', PrivateMessages)