import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFParse = require('pdf-parse');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Basic password policy: 8+ chars, upper, lower, number, special
const passwordMeetsPolicy = (pwd) => {
  const lengthOk = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return lengthOk && hasUpper && hasLower && hasNumber && hasSpecial;
};

const signToken = (user) => {
  return jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (!passwordMeetsPolicy(password)) {
      return res.status(400).json({
        message:
          'Password must be 8+ chars and include upper, lower, number, and special character.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = req.user; // Injected by authMiddleware
    return res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body; // Google ID token
    if (!credential) return res.status(400).json({ message: 'Missing Google credential.' });
    if (!googleClient) return res.status(500).json({ message: 'Google auth not configured.' });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    if (!email) return res.status(400).json({ message: 'Google token has no email.' });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ 
        name: name || email, 
        email, 
        googleId: sub, 
        avatarUrl: picture,
        passwordHash: null // No password for Google OAuth users
      });
    } else {
      // Link Google account if not linked yet
      if (!user.googleId) {
        user.googleId = sub;
        if (picture) user.avatarUrl = picture;
        if (name && !user.name) user.name = name;
        await user.save();
      }
    }

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadResume = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { mimetype, originalname, buffer, size } = req.file;

    // Validate file type
    if (mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are supported.' });
    }

    // Validate file size (10MB limit)
    if (size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size exceeds 10MB limit.' });
    }

    // Extract text from PDF
    let extractedText = '';
    try {
      const pdfData = await PDFParse(buffer);
      extractedText = pdfData.text || '';
    } catch (parseErr) {
      return res.status(400).json({ message: 'Failed to parse PDF. Please ensure it is a valid PDF file.' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ message: 'PDF appears to be empty or unreadable.' });
    }

    // Update user with resume info
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'resume.hasResume': true,
        'resume.filename': originalname,
        'resume.mimeType': mimetype,
        'resume.extractedText': extractedText,
        'resume.uploadedAt': new Date(),
      },
      { new: true }
    );

    return res.status(200).json({
      message: 'Resume uploaded successfully.',
      resume: {
        hasResume: user.resume.hasResume,
        filename: user.resume.filename,
        uploadedAt: user.resume.uploadedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getResume = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('resume').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const resume = user.resume || {};
    const hasResume = Boolean(resume.hasResume);

    // Return a stable payload even when the user has no resume yet
    return res.status(200).json({
      resume: {
        hasResume,
        filename: resume.filename || null,
        uploadedAt: resume.uploadedAt || null,
        extractedText: resume.extractedText || '',
      },
    });
  } catch (err) {
    next(err);
  }
};
