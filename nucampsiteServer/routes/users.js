const express = require('express');
const User = require('../models/user');

const router = express.Router();


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {
  User.findOne({ username: req.body.username }) //check if username exists
    .then(user => {
      if (user) {
        const err = new Error(`User ${req.body.username} already exists!`);
        err.status = 403;
        return next(err);
      } else {
        User.create({
          username: req.body.username,
          password: req.body.password
        })
          .then(user => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({ status: 'Registration Successful!', user: user });
          })
          .catch(err => next(err)); //rejected promise from create method
      }
    })
    .catch(err => next(err)); //rejected promise from findOne method
});

router.post('/login', (req, res, next) => {
  if (!req.session.user) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      const err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic');
      err.status = 401;
      return next(err);
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const [username, password] = auth;
    User.findOne({ username: username }) //find user
      .then(user => {
        if (!user) {
          const err = new Error(`User ${username} does not exist!`);
          err.status = 401;
          return next(err);
        } else if (user.password !== password) { //user found, check password
          const err = new Error('Your password is incorrect!');
          err.status = 401;
          return next(err);
        } else if (user.username === username && user.password === password) { //user and password match
          req.session.user = 'authenticated';
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.json('You are authenticated');
        }
      })
      .catch(err => next(err));
  } else { //session already being tracked for this client
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('You are already authenticated!');
  }
});

router.get('/logout', (req,res, next) => {
  if(req.session) { //check if session exists
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
