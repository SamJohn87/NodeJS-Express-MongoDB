const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose'); //will handle username and password with hashing and salting
const Schema = mongoose.Schema;

const userSchema = new Schema({
    admin: {
        type: Boolean,
        default: false
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
