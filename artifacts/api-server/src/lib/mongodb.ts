import mongoose from "mongoose";
import { logger } from "./logger";

if (!process.env["MONGODB_URI"]) {
  throw new Error("MONGODB_URI environment variable is required.");
}

const MONGODB_URI = process.env["MONGODB_URI"];

let isConnected = false;

export async function connectMongo(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    throw err;
  }
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error({ err }, "MongoDB connection error");
});

export default mongoose;
