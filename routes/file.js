const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const logger = require('../logger');
const router = express.Router();
const { db } = require('../server');

// Allowed file types (images and pdf)
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Multer storage with sanitized file names
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Sanitize file name: remove special chars, keep extension
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
        const unique = crypto.randomBytes(6).toString('hex');
        cb(null, `${base}-${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        logger.error(`Rejected upload: invalid file type (${file.originalname})`);
        return cb(new Error('Only images and PDF files are allowed'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
});

// Store file metadata in MongoDB
async function saveFileLink(token, filePath, originalName, expiresAt) {
    await db.collection('fileLinks').insertOne({ token, filePath, originalName, expiresAt });
}
async function getFileLink(token) {
    return db.collection('fileLinks').findOne({ token });
}
async function deleteFileLink(token) {
    await db.collection('fileLinks').deleteOne({ token });
}
async function cleanupExpiredLinks() {
    const now = Date.now();
    const expired = await db.collection('fileLinks').find({ expiresAt: { $lt: now } }).toArray();
    for (const entry of expired) {
        try {
            fs.unlinkSync(entry.filePath);
        } catch (e) { logger.error('File cleanup error', e); }
        await deleteFileLink(entry.token);
    }
}
// Run cleanup every hour
setInterval(cleanupExpiredLinks, 60 * 60 * 1000);

router.post('/upload', (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            logger.error('File upload error', err);
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        // Generate unique token and expiry (e.g., 1 hour)
        const token = crypto.randomBytes(24).toString('hex');
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
        await saveFileLink(token, req.file.path, req.file.originalname, expiresAt);
        const link = `${req.protocol}://${req.get('host')}/api/file/download/${token}`;
        res.json({ link, expiresAt });
    });
});

// Secure download endpoint
router.get('/download/:token', async (req, res) => {
    const { token } = req.params;
    const entry = await getFileLink(token);
    if (!entry) return res.status(404).send('Invalid or expired link');
    if (Date.now() > entry.expiresAt) {
        await deleteFileLink(token);
        return res.status(410).send('Link expired');
    }
    res.download(path.resolve(entry.filePath), entry.originalName);
});

module.exports = router; 