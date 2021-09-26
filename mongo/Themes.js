const { Schema, model } = require('mongoose')

const Themes = new Schema({
    themeID: { type: Number, },
    parentID: { type: Number, required: true, default: null},
    categoryID: { type: Number, required: true, },
    ownerID: { type: String, required: true,},
    content: { type: String, required: true,},
    name: { type: String, required: true,},
    date: { type: String, required: true,},
    isClosed: { type: Boolean, default: false, },
})

module.exports = model('Themes', Themes)