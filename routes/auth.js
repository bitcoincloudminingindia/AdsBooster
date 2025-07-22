const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const router = express.Router();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
},
    function (accessToken, refreshToken, profile, done) {
        // In production, save/find user in DB here
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Start Google OAuth2 login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth2 callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Regenerate session ID after successful login
        req.session.regenerate(err => {
            if (err) {
                require('../logger').error('Session regeneration error after login', err);
                return res.status(500).send('Session error');
            }
            req.login(req.user, err => {
                if (err) {
                    require('../logger').error('Login error after session regeneration', err);
                    return res.status(500).send('Login error');
                }
                // Successful login, redirect or respond as needed
                res.send(`Hello, ${req.user.displayName}! Google login successful.`);
            });
        });
    }
);

module.exports = router; 