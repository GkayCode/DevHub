import type { Request, Response } from "express";
import type { GitHubSessionRecord } from "../models/GitHubSession";
import { requireFrontendOrigin } from "../services/github-oauth.service";

type Repo = {
  id: number; name: string; full_name: string; description: string | null; private: boolean;
  html_url: string; default_branch: string; updated_at: string; language: string | null;
  stargazers_count: number; forks_count: number; permissions?: { admin?: boolean; push?: boolean; maintain?: boolean };
};

function sessionFrom(res: Response): GitHubSessionRecord {
  return res.locals.githubSession as GitHubSessionRecord;
}

async function githubRequest<T>(session: GitHubSessionRecord, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DevHub",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) {
    const error = new Error(data.message || "GitHub API isteği başarısız oldu.") as Error & { statusCode?: number };
    error.statusCode = response.status === 404 ? 404 : response.status === 409 ? 409 : response.status === 422 ? 422 : response.status === 403 ? 403 : 502;
    throw error;
  }
  return data;
}

function handleError(error: unknown, res: Response): void {
  const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode: unknown }).statusCode) : 502;
  const message = error instanceof Error ? error.message : "GitHub isteği başarısız oldu.";
  res.status(statusCode).json({ success: false, message });
}

function parseRepoName(value: string): { owner: string; repo: string } | null {
  const parts = value.split("/");
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_.-]{1,100}$/.test(part))) return null;
  return { owner: parts[0], repo: parts[1] };
}

async function getWritableRepo(session: GitHubSessionRecord, owner: string, repo: string): Promise<Repo> {
  const result = await githubRequest<Repo>(session, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  if (!result.permissions?.push && !result.permissions?.admin && !result.permissions?.maintain) {
    const error = new Error("Bu depoda dosya değiştirme yetkin yok.") as Error & { statusCode?: number };
    error.statusCode = 403;
    throw error;
  }
  return result;
}

export async function listMyRepositories(_req: Request, res: Response): Promise<void> {
  try {
    const session = sessionFrom(res);
    const repositories = await githubRequest<Repo[]>(session, "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member");
    res.json({ success: true, data: repositories.map(({ id, name, full_name, description, private: isPrivate, html_url, default_branch, updated_at, language, stargazers_count, forks_count, permissions }) => ({ id, name, full_name, description, private: isPrivate, html_url, default_branch, updated_at, language, stargazers_count, forks_count, can_push: Boolean(permissions?.push || permissions?.admin || permissions?.maintain) })) });
  } catch (error) { handleError(error, res); }
}

export async function getRepositoryReadme(req: Request, res: Response): Promise<void> {
  try {
    const session = sessionFrom(res);
    const names = parseRepoName(`${String(req.params.owner || "")}/${String(req.params.repo || "")}`);
    if (!names) { res.status(400).json({ success: false, message: "Repo adı owner/repo biçiminde olmalı." }); return; }
    await githubRequest<Repo>(session, `/repos/${encodeURIComponent(names.owner)}/${encodeURIComponent(names.repo)}`);
    const readme = await githubRequest<{ name: string; path: string; sha: string; content: string; encoding: string; html_url: string }>(session, `/repos/${encodeURIComponent(names.owner)}/${encodeURIComponent(names.repo)}/readme`);
    const content = readme.encoding === "base64" ? Buffer.from(readme.content.replace(/\n/g, ""), "base64").toString("utf8") : readme.content;
    res.json({ success: true, data: { path: readme.path, sha: readme.sha, content, html_url: readme.html_url } });
  } catch (error) { handleError(error, res); }
}

export async function updateRepositoryReadme(req: Request, res: Response): Promise<void> {
  try {
    if (!requireFrontendOrigin(req)) { res.status(403).json({ success: false, message: "İstek kaynağı doğrulanamadı." }); return; }
    const session = sessionFrom(res);
    const names = parseRepoName(`${String(req.params.owner || "")}/${String(req.params.repo || "")}`);
    if (!names) { res.status(400).json({ success: false, message: "Repo adı owner/repo biçiminde olmalı." }); return; }
    const content = req.body?.content;
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "Update README via DevHub";
    const sha = typeof req.body?.sha === "string" ? req.body.sha : undefined;
    if (typeof content !== "string" || content.length > 1_000_000) { res.status(400).json({ success: false, message: "README içeriği metin olmalı ve 1 MB sınırını aşmamalı." }); return; }
    if (!message || message.length > 200) { res.status(400).json({ success: false, message: "Commit mesajı 1-200 karakter olmalı." }); return; }

    const repo = await getWritableRepo(session, names.owner, names.repo);
    const path = "README.md";
    let currentSha = sha;
    if (!currentSha) {
      try {
        const current = await githubRequest<{ sha: string }>(session, `/repos/${encodeURIComponent(names.owner)}/${encodeURIComponent(names.repo)}/contents/${path}?ref=${encodeURIComponent(repo.default_branch)}`);
        currentSha = current.sha;
      } catch (error) {
        if (!(error instanceof Error) || !("statusCode" in error) || (error as Error & { statusCode?: number }).statusCode !== 404) throw error;
      }
    }
    const result = await githubRequest<{ content?: { sha?: string; html_url?: string }; commit?: { sha?: string; html_url?: string } }>(session, `/repos/${encodeURIComponent(names.owner)}/${encodeURIComponent(names.repo)}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({ message, content: Buffer.from(content, "utf8").toString("base64"), branch: repo.default_branch, ...(currentSha ? { sha: currentSha } : {}) }),
    });
    res.json({ success: true, message: "README GitHub'a commit edildi.", data: { sha: result.content?.sha, commit_sha: result.commit?.sha, html_url: result.content?.html_url || result.commit?.html_url } });
  } catch (error) { handleError(error, res); }
}
