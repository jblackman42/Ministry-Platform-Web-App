const express = require('express');
const navigation = express.Router();

//authentication middleware
const { ensureAuthenticated } = require('../middleware/auth.js')

//home page
navigation.get('/', ensureAuthenticated, (req, res) => {
  res.render('pages/home')
  // res.sendStatus(200);
})

navigation.get('/login', (req, res) => {
  res.render('pages/login', { error: req.flash('error') });
});
navigation.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password');
});

// navigation.get('/logout', (req, res) => {
//   req.logout();
//   res.redirect('/login');
// })

navigation.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

module.exports = navigation;