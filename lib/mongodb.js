import mongoose from "mongoose";

export const connectMongoDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('Missing MONGODB_URI');
        }

        const opts = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        if (mongoose.connections[0].readyState) {
            console.log("Already connected to MongoDB");
            return;
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI, opts);
        console.log("Successfully connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}