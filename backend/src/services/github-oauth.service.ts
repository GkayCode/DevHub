import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import GitHubSession, { type GitHubSessionRecord } from "../models/GitHubSession";

const SESSION_COOKIE = "devhub_session";
const STATE_COOKIE = "devhub_oauth_state";
const useSecureCookie = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
const cookieOptions = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${useSecureCookie ? "; Secure" : ""}`;

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const item of header.split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireGitHubAppConfig(): { clientId: string; clientSecret: string; callbackUrl: string } {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  const callbackUrl = process.env.GITHUB_CALLBACK_URL?.trim();
  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error("GitHub App ayarları eksik. backend/.env dosyasındaki GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET ve GITHUB_CALLBACK_URL alanlarını doldur.");
  }
  return { clientId, clientSecret, callbackUrl };
}

async function exchangeToken(body: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json() as TokenResponse;
  if (!response.ok || result.error || !result.access_token) {
    throw new Error(result.error_description || result.error || "GitHub token işlemi başarısız oldu.");
  }
  return result;
}

export function beginGitHubLogin(res: Response): string {
  const { clientId, callbackUrl } = requireGitHubAppConfig();
  const state = randomBytes(32).toString("hex");
  res.append("Set-Cookie", `${STATE_COOKIE}=${state}; Path=/api/auth/github/callback; HttpOnly; SameSite=Lax; Max-Age=600${useSecureCookie ? "; Secure" : ""}`);
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");
  return url.toString();
}

export async function finishGitHubLogin(req: Request, res: Response): Promise<void> {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const cookieState = readCookie(req, STATE_COOKIE);
  res.append("Set-Cookie", `${STATE_COOKIE}=; Path=/api/auth/github/callback; HttpOnly; SameSite=Lax; Max-Age=0${useSecureCookie ? "; Secure" : ""}`);
  if (!code || !state || !cookieState || !safeEqual(state, cookieState)) {
    throw new Error("GitHub OAuth state doğrulanamadı. Lütfen yeniden giriş yap.");
  }

  const { clientId, clientSecret, callbackUrl } = requireGitHubAppConfig();
  const token = await exchangeToken({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: callbackUrl });
  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "DevHub" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!userResponse.ok) throw new Error("GitHub kullanıcı bilgileri alınamadı.");
  const user = await userResponse.json() as GitHubUser;
  const sessionId = randomBytes(32).toString("hex");
  await GitHubSession.create({
    _id: sessionId,
    githubId: user.id,
    login: user.login,
    name: user.name || undefined,
    avatarUrl: user.avatar_url,
    htmlUrl: user.html_url,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    accessTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined,
    refreshTokenExpiresAt: token.refresh_token_expires_in ? new Date(Date.now() + token.refresh_token_expires_in * 1000) : undefined,
  });
  res.append("Set-Cookie", `${SESSION_COOKIE}=${sessionId}; ${cookieOptions}`);
}

export async function getCurrentSession(req: Request): Promise<GitHubSessionRecord | null> {
  const sessionId = readCookie(req, SESSION_COOKIE);
  if (!sessionId || !/^[a-f0-9]{64}$/.test(sessionId)) return null;
  let session = await GitHubSession.findById(sessionId).select("+accessToken +refreshToken");
  if (!session) return null;

  if (session.accessTokenExpiresAt && session.accessTokenExpiresAt.getTime() < Date.now() + 60_000) {
    if (!session.refreshToken || (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt.getTime() <= Date.now())) {
      await GitHubSession.deleteOne({ _id: sessionId });
      return null;
    }
    const { clientId, clientSecret } = requireGitHubAppConfig();
    const token = await exchangeToken({ client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: session.refreshToken });
    session.accessToken = token.access_token!;
    if (token.refresh_token) session.refreshToken = token.refresh_token;
    session.accessTokenExpiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined;
    session.refreshTokenExpiresAt = token.refresh_token_expires_in ? new Date(Date.now() + token.refresh_token_expires_in * 1000) : session.refreshTokenExpiresAt;
    await session.save();
  }
  return session.toObject() as GitHubSessionRecord;
}

export async function logout(req: Request, res: Response): Promise<void> {
  const sessionId = readCookie(req, SESSION_COOKIE);
  if (sessionId && /^[a-f0-9]{64}$/.test(sessionId)) await GitHubSession.deleteOne({ _id: sessionId });
  res.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${useSecureCookie ? "; Secure" : ""}`);
}

export function requireFrontendOrigin(req: Request): boolean {
  const expected = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const origin = req.get("origin");
  return origin === expected;
}

export { SESSION_COOKIE };
