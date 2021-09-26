const { Schema, model } = require('mongoose')

const date = () => new Date().toLocaleString().split(', ')[0]

const User = new Schema({
    userID: { type: String, required: true, unique: true, },
    username: { type: String, required: true, },
    avatar: { type: String, },
    avatarLast: { type: String, default: 'https://cdn.discordapp.com/embed/avatars/2.png', },
    badges: { type: Array, default: ['none'], },
    dateRegister: {type: Date, default: Date.now()},
    dateNormal: { type: String, default: date() },
    isBan: {type: Boolean, required: true, default: false, },
    isAdmin: { type: Boolean, required: true, default: false, },
})

module.exports = model('User', User)