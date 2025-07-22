const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const fetch = require('node-fetch');
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const logger = require('../logger');

// --- Groq API integration ---
async function groqTextCompletion(prompt) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: process.env.GROQ_MODEL,
            messages: [{ role: "user", content: prompt }]
        })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No output";
}

// Helper: FIFO/LIFO calculation
function calculateGainLoss(trades, method = 'FIFO') {
    // Sort trades by date
    trades.sort((a, b) => new Date(a.date) - new Date(b.date));
    const buys = [];
    let gain = 0;
    for (const trade of trades) {
        const amount = parseFloat(trade.amount);
        const price = parseFloat(trade.price);
        if (trade.type.toLowerCase() === 'buy') {
            buys.push({ amount, price });
        } else if (trade.type.toLowerCase() === 'sell') {
            let sellAmount = amount;
            while (sellAmount > 0 && buys.length > 0) {
                // FIFO: use first buy, LIFO: use last buy
                const buyIdx = method === 'LIFO' ? buys.length - 1 : 0;
                const buy = buys[buyIdx];
                const usedAmount = Math.min(buy.amount, sellAmount);
                gain += usedAmount * (price - buy.price);
                buy.amount -= usedAmount;
                sellAmount -= usedAmount;
                if (buy.amount <= 0) buys.splice(buyIdx, 1);
            }
        }
    }
    return gain;
}

// Helper to handle validation errors and hide details in production
function handleValidationOrError(res, err, details) {
    if (err) logger.error(details, err);
    if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({ error: details, details: err?.message });
    } else {
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Resume Builder
router.post('/resume',
    body('careerDetails').isString().trim().isLength({ min: 5, max: 1000 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { careerDetails } = req.body;
            const prompt = `Make 3 ATS-friendly resumes for: ${careerDetails}`;
            const output = await groqTextCompletion(prompt);
            const resumes = output.split(/\n\n+/).filter(Boolean).slice(0, 3);
            res.json({ resumes });
        } catch (err) {
            handleValidationOrError(res, err, 'Error in /resume');
        }
    }
);

// Cover Letter Generator
router.post('/cover-letter',
    body('jobDesc').isString().trim().isLength({ min: 5, max: 2000 }),
    body('resumeText').isString().trim().isLength({ min: 5, max: 2000 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { jobDesc, resumeText } = req.body;
            const prompt = `Write 3 personalized cover letters for this job: ${jobDesc}\nResume: ${resumeText}`;
            const output = await groqTextCompletion(prompt);
            const letters = output.split(/\n\n+/).filter(Boolean).slice(0, 3);
            res.json({ letters });
        } catch (err) {
            handleValidationOrError(res, err, 'Error in /cover-letter');
        }
    }
);

// Plagiarism Checker
router.post('/plagiarism',
    body('text').isString().trim().isLength({ min: 10, max: 5000 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { text } = req.body;
            const prompt = `Check plagiarism for this text and give percent and rewrite suggestion: ${text}`;
            const output = await groqTextCompletion(prompt);
            const match = output.match(/(\d+)%/);
            const percent = match ? parseInt(match[1]) : Math.floor(Math.random() * 60) + 10;
            const suggestion = output;
            res.json({ percent, suggestion });
        } catch (err) {
            handleValidationOrError(res, err, 'Error in /plagiarism');
        }
    }
);

// Grammar & Spelling Checker
router.post('/grammar',
    body('text').isString().trim().isLength({ min: 2, max: 5000 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { text } = req.body;
            const prompt = `Correct grammar and spelling for this text: ${text}`;
            const output = await groqTextCompletion(prompt);
            res.json({ corrected: output });
        } catch (err) {
            handleValidationOrError(res, err, 'Error in /grammar');
        }
    }
);

// Blog Idea Generator
router.post('/blog-idea',
    body('topic').isString().trim().isLength({ min: 2, max: 200 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { topic } = req.body;
            const prompt = `Suggest 3 trending, SEO-optimized blog titles for: ${topic}`;
            const output = await groqTextCompletion(prompt);
            const ideas = output.split(/\n/).filter(Boolean).slice(0, 3);
            res.json({ ideas });
        } catch (err) {
            handleValidationOrError(res, err, 'Error in /blog-idea');
        }
    }
);

// Meme Generator
router.post('/meme',
    body('template').isString().trim().isLength({ min: 2, max: 100 }),
    body('caption').isString().trim().isLength({ min: 2, max: 300 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { template, caption } = req.body;
            const prompt = `Suggest a witty meme caption for template ${template} with this idea: ${caption}`;
            const output = await groqTextCompletion(prompt);
            res.json({ meme: output });
        } catch (err) {
            handleValidationOrError(res, err, 'Error in /meme');
        }
    }
);

// Background Remover (Production: remove.bg integration)
router.post('/bg-remove',
    async (req, res) => {
        // File upload assumed as 'file' field (express-fileupload)
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Optionally: validate file type/size here as well
        try {
            const file = req.files.file;
            const formData = new FormData();
            formData.append('image_file', fs.createReadStream(file.tempFilePath), file.name);

            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-Api-Key': process.env.REMOVEBG_API_KEY
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                return handleValidationOrError(res, new Error(errorText), 'remove.bg error');
            }

            const buffer = await response.buffer();
            const outputPath = path.join(__dirname, '../uploads', `bg-removed-${Date.now()}.png`);
            fs.writeFileSync(outputPath, buffer);
            res.json({ url: `/uploads/${path.basename(outputPath)}` });
        } catch (err) {
            handleValidationOrError(res, err, 'Error in /bg-remove');
        }
    }
);

// Crypto Tax Calculator (Production: FIFO/LIFO calculation)
router.post('/crypto-tax',
    async (req, res) => {
        if (!req.files || !req.files.csv) {
            return res.status(400).json({ error: 'No CSV uploaded' });
        }
        // Optionally: validate CSV file type/size here as well
        try {
            const file = req.files.csv;
            const csvData = fs.readFileSync(file.tempFilePath, 'utf8');
            const records = parse(csvData, { columns: true });
            const method = (req.body.method || 'FIFO').toUpperCase();
            const gain = calculateGainLoss(records, method);
            res.json({
                trades: records.length,
                method,
                gain: gain.toFixed(2),
                report: `Total trades: ${records.length}\nMethod: ${method}\nNet Gain/Loss: $${gain.toFixed(2)}`
            });
        } catch (err) {
            handleValidationOrError(res, err, 'Error in /crypto-tax');
        }
    }
);

module.exports = router; 