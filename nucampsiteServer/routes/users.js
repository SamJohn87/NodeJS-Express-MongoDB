const express = require('express');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
  res.send('respond with a resource');
});

router.post('/signup', (req, res) => {
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    (err, user) => { //will contain user document create if successful
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({ err: err });
      } else {
        if (req.body.firstname) {
          user.firstname = req.body.firstname;
        }
        if (req.body.lastname) {
          user.lastname = req.body.lastname;
        }
        user.save(err => {  //save to database
          if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({ err: err });
            return
          }
          passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, status: 'Registration Successful!' });
          });
        });
      }
    }
  );
});

router.post('/login', passport.authenticate('local'), (req, res) => { //using local strategy to authenticate user
  //response if login is successfull - passport handles errors
  //issue token to user
  const token = authenticate.getToken({ _id: req.user._id });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, token: token, status: 'You are successfully logged in!' }); //add token in response to client
});

router.get('/logout', (req, res, next) => {
  if (req.session) { //check if session exists
    req.session.destroy(); //deleting session file on server side
    res.clearCookie('session-id'); //clear cookie stored on the client
    res.redirect('/'); //redirect user to root path
  } else {
    const err = new Error('You are not logged in!');
    err.status = 401;
    return next(err);
  }
});

module.exports = router;
