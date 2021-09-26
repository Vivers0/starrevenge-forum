const { Schema, model } = require('mongoose')

const Topic = new Schema({
    topicID: { type: Number, },
    procreator: { type: Number, required: true},
    ownerID: { type: String, required: true,},
    content: { type: String, required: true,},
    name: { type: String, required: true,},
    date: { type: String, required: true,},
    isClosed: { type: Boolean, default: false, },
    isComment: { type: Boolean, require: true, }
})

module.exports = model('Topic', Topic)