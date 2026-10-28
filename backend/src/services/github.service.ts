
import type {
  GitHubRepository,
  GitHubUser,
} from "../types/github";

const GITHUB_API = "https://api.github.com";

export class GitHubApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "GitHubApiError";
    this.statusCode = statusCode;
  }
}

async function githubRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DevHub-App",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubApiError(
        "GitHub kullanıcısı veya kaynağı bulunamadı.",
        404
      );
    }

    if (response.status === 403 || response.status === 429) {
      throw new GitHubApiError(
        "GitHub API istek sınırına ulaşılmış olabilir.",
        429
      );
    }

    throw new GitHubApiError(
      "GitHub API isteği başarısız oldu.",
      502
    );
  }

  return (await response.json()) as T;
}

export async function getGitHubUser(
  username: string
): Promise<GitHubUser> {
  return githubRequest<GitHubUser>(
    `/users/${encodeURIComponent(username)}`
  );
}

export async function getGitHubRepositories(
  username: string,
  page = 1,
  perPage = 20,
  sort = "updated"
): Promise<GitHubRepository[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort,
    direction: "desc",
  });

  return githubRequest<GitHubRepository[]>(
    `/users/${encodeURIComponent(username)}/repos?${params}`
  );
}

export interface RepositorySearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

export async function searchGitHubRepositories(
  query: string,
  page = 1,
  perPage = 20,
  sort = "stars",
  language?: string
): Promise<RepositorySearchResult> {
  const searchTerms = [query.trim()];

  if (language) {
    searchTerms.push(`language:${language}`);
  }

  const params = new URLSearchParams({
    q: searchTerms.join(" "),
    page: String(page),
    per_page: String(perPage),
    sort,
    order: "desc",
  });

  return githubRequest<RepositorySearchResult>(
    `/search/repositories?${params}`
  );
}
