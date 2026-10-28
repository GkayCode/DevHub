import { getGitHubRepositories } from "./github.service";
import type { GitHubRepositoryStats } from "../types/github-stats";

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export async function getGitHubRepositoryStats(
  username: string
): Promise<GitHubRepositoryStats> {
  let analyzedRepositories = 0;
  let totalStars = 0;
  let totalForks = 0;
  let truncated = false;

  const languageCounts = new Map<string, number>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const repositories = await getGitHubRepositories(
      username,
      page,
      PAGE_SIZE,
      "updated"
    );

    analyzedRepositories += repositories.length;

    for (const repository of repositories) {
      totalStars += repository.stargazers_count;
      totalForks += repository.forks_count;

      if (repository.language) {
        const currentCount =
          languageCounts.get(repository.language) ?? 0;

        languageCounts.set(
          repository.language,
          currentCount + 1
        );
      }
    }

    if (repositories.length < PAGE_SIZE) {
      break;
    }

    if (page === MAX_PAGES) {
      truncated = true;
    }
  }

  const languages = Array.from(
    languageCounts.entries(),
    ([language, repositories]) => ({
      language,
      repositories,
    })
  ).sort((a, b) => b.repositories - a.repositories);

  return {
    username,
    analyzedRepositories,
    totalStars,
    totalForks,
    languages,
    truncated,
  };
}