const { Schema, model} = require('mongoose')

const testschema = new Schema({
    token: String,
    userID: String,
})
module.exports = model('Token', testschema)