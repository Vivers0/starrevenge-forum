const { Schema, model } = require('mongoose')

const date = () => new Date().toLocaleString().split(', ')[0]

const Comment = new Schema({
    commentID: { type: Number, required: true, },
    topicID: { type: Number, required: true, },
    content: { type: String, required: true,},
    userID: { type: String, required: true,},
    date: { type: Date, default: Date.now(), },
    dateNormal: { type: String, default: date(),},
})

module.exports = model('Comment', Comment)