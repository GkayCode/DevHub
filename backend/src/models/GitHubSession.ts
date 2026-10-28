import { Schema, model, models, type Model } from "mongoose";

export interface GitHubSessionRecord {
  _id: string;
  githubId: number;
  login: string;
  name?: string;
  avatarUrl?: string;
  htmlUrl?: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GitHubSessionSchema = new Schema<GitHubSessionRecord>(
  {
    _id: { type: String, required: true },
    githubId: { type: Number, required: true },
    login: { type: String, required: true },
    name: String,
    avatarUrl: String,
    htmlUrl: String,
    accessToken: { type: String, required: true, select: false },
    refreshToken: { type: String, select: false },
    accessTokenExpiresAt: Date,
    refreshTokenExpiresAt: Date,
  },
  { timestamps: true, versionKey: false }
);

GitHubSessionSchema.index({ createdAt:  1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const GitHubSession = (models.GitHubSession as Model<GitHubSessionRecord> | undefined)
  ?? model<GitHubSessionRecord>("GitHubSession", GitHubSessionSchema);

export default GitHubSession;
