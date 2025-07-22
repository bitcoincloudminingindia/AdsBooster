const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const router = express.Router();
require('dotenv').config();
const { connectDB } = require('../db');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async function (accessToken, refreshToken, profile, done) {
        try {
            const db = await connectDB();
            const users = db.collection('users');
            // Google id से user find करो
            let user = await users.findOne({ googleId: profile.id });
            if (!user) {
                // नया user insert करो
                user = {
                    googleId: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
                    photo: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                    createdAt: new Date()
                };
                await users.insertOne(user);
            } else {
                // Existing user का data update करो
                await users.updateOne(
                    { googleId: profile.id },
                    {
                        $set: {
                            displayName: profile.displayName,
                            email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
                            photo: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                            lastLogin: new Date()
                        }
                    }
                );
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
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