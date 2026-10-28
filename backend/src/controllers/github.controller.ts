
import type { Request, Response } from "express";
import {
  getGitHubRepositories,
  getGitHubUser,
  searchGitHubRepositories,
  GitHubApiError,
} from "../services/github.service";

function isValidUsername(username: string): boolean {
  return (
    username.length >= 1 &&
    username.length <= 39 &&
    /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/.test(
      username
    )
  );
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof GitHubApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    res.status(504).json({
      success: false,
      message: "GitHub API isteği zaman aşımına uğradı.",
    });
    return;
  }

  console.error("GitHub API error:", error);

  res.status(502).json({
    success: false,
    message: "GitHub servisine şu anda ulaşılamıyor.",
  });
}

export async function getProfile(
  req: Request,
  res: Response
): Promise<void> {
  const usernameParam = req.params.username;
  const username = Array.isArray(usernameParam)
    ? usernameParam[0]
    : usernameParam;

  if (typeof username !== "string" || !isValidUsername(username)) {
    res.status(400).json({
      success: false,
      message: "Geçerli bir GitHub kullanıcı adı gir.",
    });
    return;
  }

  try {
    const user = await getGitHubUser(username);

    res.json({ success: true, data: user });
  } catch (error) {
    handleError(error, res);
  }
}

export async function getRepositories(
  req: Request,
  res: Response
): Promise<void> {
  const usernameParam = req.params.username;
  const username = Array.isArray(usernameParam)
    ? usernameParam[0]
    : usernameParam;

  if (typeof username !== "string" || !isValidUsername(username)) {
    res.status(400).json({
      success: false,
      message: "Geçerli bir GitHub kullanıcı adı gir.",
    });
    return;
  }

  const page = Number(req.query.page ?? 1);
  const perPage = Number(req.query.per_page ?? 20);
  const sort = String(req.query.sort ?? "updated");

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(perPage) ||
    perPage < 1 ||
    perPage > 100 ||
    !["created", "updated", "pushed", "full_name"].includes(sort)
  ) {
    res.status(400).json({
      success: false,
      message: "Sayfalama veya sıralama parametreleri geçersiz.",
    });
    return;
  }

  try {
    const repositories = await getGitHubRepositories(
      username,
      page,
      perPage,
      sort
    );

    res.json({
      success: true,
      count: repositories.length,
      page,
      per_page: perPage,
      data: repositories,
    });
  } catch (error) {
    handleError(error, res);
  }
}

export async function searchRepositories(
  req: Request,
  res: Response
): Promise<void> {
  const query = String(req.query.q ?? "").trim();
  const language = String(req.query.language ?? "").trim();
  const page = Number(req.query.page ?? 1);
  const perPage = Number(req.query.per_page ?? 20);
  const sort = String(req.query.sort ?? "stars");

  if (query.length < 2 || query.length > 100) {
    res.status(400).json({
      success: false,
      message: "Arama terimi 2-100 karakter arasında olmalı.",
    });
    return;
  }

  if (
    language.length > 50 ||
    (language && !/^[a-zA-Z0-9+#.-]+$/.test(language))
  ) {
    res.status(400).json({
      success: false,
      message: "Programlama dili filtresi geçersiz.",
    });
    return;
  }

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 1000 ||
    !Number.isInteger(perPage) ||
    perPage < 1 ||
    perPage > 100 ||
    !["stars", "forks", "help-wanted-issues", "updated"].includes(sort)
  ) {
    res.status(400).json({
      success: false,
      message: "Sayfalama veya sıralama parametreleri geçersiz.",
    });
    return;
  }

  try {
    const result = await searchGitHubRepositories(
      query,
      page,
      perPage,
      sort,
      language || undefined
    );

    res.json({
      success: true,
      count: result.items.length,
      total_count: result.total_count,
      page,
      per_page: perPage,
      data: result.items,
    });
  } catch (error) {
    handleError(error, res);
  }
}
