const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    aboutme: String,
    cityState: String,
    displayname: String,
    email: String,
    firstname: String,
    gender: String,
    lastname: String,
    password: String,
    passwordRaw: String,
    phonenumber: String,
    dateMember: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);