const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const session = require('express-session');
const passport = require('passport');
const logger = require('./logger');
const csurf = require('csurf');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./db');

const app = express();

// Helmet for HTTP security headers
app.use(helmet());

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, 'https://' + req.headers.host + req.originalUrl);
        }
        next();
    });
}

// CORS restrictions
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            logger.warn(`Blocked CORS request from origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
// NOTE: In production, use a scalable session store like connect-mongo or connect-redis
// Example (uncomment and configure as needed):
// const MongoStore = require('connect-mongo');
app.use(session({
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    secret: process.env.SESSION_SECRET || 'your_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// CSRF protection (exclude safe methods and public download route)
const csrfProtection = csurf({ cookie: false });
app.use((req, res, next) => {
    // Exclude GET/HEAD/OPTIONS and file download route from CSRF
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path.startsWith('/api/file/download')) {
        return next();
    }
    csrfProtection(req, res, next);
});
// Send CSRF token for frontend use
app.use((req, res, next) => {
    if (req.csrfToken) {
        res.locals.csrfToken = req.csrfToken();
        res.setHeader('X-CSRF-Token', res.locals.csrfToken);
    }
    next();
});
// CSRF error handler
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        logger.warn('CSRF token mismatch or missing', { url: req.originalUrl, ip: req.ip });
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next(err);
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
let db;
// connectDB(); // This line is removed as per the edit hint.

// Rate limiting
app.use(rateLimit({ windowMs: 60 * 1000, max: 60 }));

// Serve static frontend files from the root directory
app.use(express.static(__dirname));

// Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/file', require('./routes/file'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/auth', require('./routes/auth'));
const stocksRouter = require('./routes/stocks');
app.use('/api/stocks', stocksRouter);
app.use('/proxy-status', require('./routes/proxy'));

// DO NOT serve uploads/ statically in production. Only allow access via secure download route in routes/file.js
if (process.env.NODE_ENV !== 'production') {
    // In development, you may want to serve uploads/ for testing
    app.use('/uploads', express.static('uploads', { index: false, dotfiles: 'deny' }));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

process.on('uncaughtException', err => {
    logger.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
    logger.error('Unhandled Rejection:', err);
}); 