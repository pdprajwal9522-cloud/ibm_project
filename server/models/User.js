import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, index: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    resume: {
      hasResume: { type: Boolean, default: false },
      filename: { type: String },
      mimeType: { type: String },
      extractedText: { type: String }, // Store parsed text for AI analysis
      uploadedAt: { type: Date },
      fileId: { type: String }, // GridFS file ID if using GridFS
    },
  },
  { timestamps: true }
);

// Email has unique index by schema definition

const User = mongoose.model('User', UserSchema);
export default User;
