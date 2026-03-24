/**
 * @file server.js
 * @description Main Entry Point. Initializes Express, Database, and Routes.
 * @author Senior Architect
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; 
import { dirname } from 'path';

// ES module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Imports
import connectDB from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorMiddleware.js';

const app = express(); 
const PORT = process.env.PORT || 5000;

// --- 1. INITIALIZATION ---

// Ensure 'uploads' directory exists (Critical for Vision API)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log(`[System] Created uploads directory at ${uploadDir}`);
}

// Connect to Database (Non-blocking)
// It will warn but not crash if MongoDB is missing (Hackathon friendly)
connectDB();

// --- 2. MIDDLEWARE ---

app.use(cors()); // Allow Frontend access
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse Form Data

// --- 3. ROUTES ---

// Mount all API routes under /api
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Health Check Endpoint
app.get('/', (req, res) => {
    res.status(200).json({ status: 'active', system: 'SkillForge AI Brain' });
});

// --- 4. ERROR HANDLING ---
// Must be placed AFTER route definitions
app.use(errorHandler);

// --- 5. START SERVER ---

app.listen(PORT, () => {
    console.log(`
    🚀 SkillForge AI Server Launched
    --------------------------------
    📡 Port:     ${PORT}
    🔧 Env:      ${process.env.NODE_ENV || 'development'}
    📂 Uploads:  Ready
    --------------------------------
    `);
});
