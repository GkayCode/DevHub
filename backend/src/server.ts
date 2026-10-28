import mongoose from "mongoose";
import dotenv from "dotenv";

import app from "./app";
import { seedDefaultReadmeTemplates } from "./controllers/readme-templates.controller";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

async function startServer(): Promise<void> {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully.");

    await seedDefaultReadmeTemplates();
    console.log("README templates are ready.");

    app.listen(PORT, () => {
      console.log(`DevHub API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer(); 