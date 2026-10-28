import type { Request, Response, NextFunction } from "express";
import { getCurrentSession } from "../services/github-oauth.service";

export async function requireGitHubSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await getCurrentSession(req);
    if (!session) {
      res.status(401).json({ success: false, message: "Devam etmek için GitHub hesabınla giriş yap." });
      return;
    }
    res.locals.githubSession = session;
    next();
  } catch (error) {
    next(error);
  }
}
