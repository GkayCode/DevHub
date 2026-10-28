import type { RequestHandler } from "express";
import { getGitHubRepositoryStats } from "../services/github-stats.service";
import { GitHubApiError } from "../services/github.service";

const usernamePattern =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export const getRepositoryStats: RequestHandler = async (
  req,
  res
) => {
  const usernameParam = req.params.username;
  const username = Array.isArray(usernameParam)
    ? usernameParam[0]
    : usernameParam;

  if (
    typeof username !== "string" ||
    !usernamePattern.test(username)
  ) {
    res.status(400).json({
      success: false,
      message: "Geçersiz GitHub kullanıcı adı.",
    });
    return;
  }

  try {
    const stats = await getGitHubRepositoryStats(username);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("GitHub repository stats error:", error);

    res.status(502).json({
      success: false,
      message: "GitHub istatistikleri alınamadı.",
    });
  }
};