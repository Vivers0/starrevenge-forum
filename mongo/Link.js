const { Schema, model } = require('mongoose')

const Link = new Schema({
    link: {type: String, required: true, },
    name: {type: String, required: true, },
    procreator: {
        chapterName: {type: String, default: null, },
        category: {type: String, default: null, },
    },
})

module.exports = model('Link', Link)