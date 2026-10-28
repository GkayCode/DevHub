import type { Request, Response } from "express";
import { beginGitHubLogin, finishGitHubLogin, getCurrentSession, logout, requireFrontendOrigin } from "../services/github-oauth.service";

const frontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

export function startGitHubAuth(_req: Request, res: Response): void {
  try {
    res.redirect(beginGitHubLogin(res));
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub girişi başlatılamadı.";
    res.redirect(`${frontendUrl()}/my-repositories?authError=${encodeURIComponent(message)}`);
  }
}

export async function githubCallback(req: Request, res: Response): Promise<void> {
  try {
    if (req.query.error) throw new Error("GitHub giriş isteği iptal edildi veya reddedildi.");
    await finishGitHubLogin(req, res);
    res.redirect(`${frontendUrl()}/my-repositories?connected=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub girişi başarısız oldu.";
    res.redirect(`${frontendUrl()}/my-repositories?authError=${encodeURIComponent(message)}`);
  }
}

export async function currentUser(req: Request, res: Response): Promise<void> {
  const session = await getCurrentSession(req);
  if (!session) {
    res.json({ success: true, authenticated: false, user: null });
    return;
  }
  res.json({ success: true, authenticated: true, user: { id: session.githubId, login: session.login, name: session.name, avatar_url: session.avatarUrl, html_url: session.htmlUrl } });
}

export async function logoutUser(req: Request, res: Response): Promise<void> {
  if (!requireFrontendOrigin(req)) {
    res.status(403).json({ success: false, message: "İstek kaynağı doğrulanamadı." });
    return;
  }
  await logout(req, res);
  res.json({ success: true });
}
