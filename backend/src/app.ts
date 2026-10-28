import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import githubRoutes from "./routes/github.routes";
import githubStatsRoutes from "./routes/github-stats.routes";
import readmeTemplatesRoutes from "./routes/readme-templates.routes";

import securityHeaders from "./middleware/security-headers";

import requestLogger from "./middleware/request-logger";
import readmeBuilderRoutes from "./routes/readme-builder.routes";
import rateLimit from "./middleware/rate-limit";
import notFound from "./middleware/not-found";
import readmeDraftsRoutes from "./routes/readme-drafts.routes";
import errorHandler from "./middleware/error-handler";
import authRoutes from "./routes/auth.routes";
import managedGitHubRoutes from "./routes/managed-github.routes";

const app = express();

app.disable("x-powered-by");

app.use(securityHeaders);
app.use(requestLogger);
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
app.use(cors({ origin: frontendUrl, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", rateLimit);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "DevHub API is running.",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/account", managedGitHubRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/github-stats", githubStatsRoutes);
app.use("/api/readme-drafts", readmeDraftsRoutes);
app.use("/api/readme-templates", readmeTemplatesRoutes);

app.use("/api/readme-builder", readmeBuilderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;