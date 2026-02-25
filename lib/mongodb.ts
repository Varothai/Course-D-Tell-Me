import mongoose from "mongoose"

export const connectMongoDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Missing MONGODB_URI')
    }

    // Check if already connected
    if (mongoose.connections[0].readyState === 1) {
      return
    }

    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5, // Limit connections per serverless instance (M0 Atlas = 500 total)
    }

    await mongoose.connect(process.env.MONGODB_URI, opts)
    console.log("Connected to MongoDB")
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
    throw error
  }
} 