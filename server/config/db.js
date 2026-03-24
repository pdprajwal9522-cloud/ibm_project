import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let gridFSBucket;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skillforge');
        console.log(`[MongoDB] Connected: ${conn.connection.host}`);

        // Initialize GridFSBucket after connection is open
        gridFSBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
            bucketName: 'resumes',
        });
    } catch (error) {
        console.warn(`[MongoDB] Connection Failed: ${error.message}`);
        console.warn(`[System] Continuing without Database (Hackathon Mode)`);
        // In production, we would exit: process.exit(1);
    }
};

export const getGridFSBucket = () => gridFSBucket;

export default connectDB;