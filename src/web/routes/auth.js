const express = require('express');
const passport = require('passport');
const router = express.Router();
const { isAuthenticated } = require('../auth');

// Login route - redirect to Discord OAuth
router.get('/login', passport.authenticate('discord', {
  scope: ['identify', 'guilds']
}));

// Discord callback route
router.get('/callback', 
  passport.authenticate('discord', {
    failureRedirect: '/?error=auth_failed'
  }),
  (req, res) => {
    // Successful authentication, redirect to dashboard
    res.redirect('/dashboard');
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('Logout error:', err);
    req.session.destroy();
    res.redirect('/');
  });
});

// Get current user info
router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    user: req.user,
    guilds: req.session.guilds || []
  });
});

module.exports = router; 