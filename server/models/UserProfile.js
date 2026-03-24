import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Internal App Username
  githubUsername: { type: String },
  
  // Store fetched GitHub Stats (Caching mechanism)
  githubStats: {
    followers: Number,
    repos: Number,
    totalCommits: Number,
    topLanguages: [{ language: String, percentage: Number }],
    lastScanned: { type: Date, default: Date.now }
  },

  // Resume Storage
  resume: {
    hasResume: { type: Boolean, default: false },
    textContent: { type: String }, // Store parsed text for AI analysis
    fileUrl: { type: String },     // URL if you upload to AWS/Cloudinary (Optional)
    uploadedAt: Date
  }
});

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
export default UserProfile;
