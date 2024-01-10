const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; //strategy constructor from the local strategy library
const User = require('./models/user'); //user schema has access to the passport local mongoose plugin

//add specific strategy plugin to passport implementation
exports.local = passport.use(new LocalStrategy(User.authenticate()));
//serialization and deserialization are necessary when using sessions to passport
passport.serializeUser(User.serializeUser()); //needed to store session data from request object
passport.deserializeUser(User.deserializeUser()); //when user is successfully verified and added to request object