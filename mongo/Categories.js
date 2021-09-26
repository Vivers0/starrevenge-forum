const { Schema, model } = require('mongoose')

const Categories = new Schema({
    categoryID: { type: Number, required: true, },
    categoryName: {type: String, required: true, },
    procreator: {
        chapterName: {type: String, default: null, },
        category: {type: String, default: null, },
    },
    description: { type: String, required: true, },
    isComment: { type: Boolean, required: true,},
})

module.exports = model('Categories', Categories)