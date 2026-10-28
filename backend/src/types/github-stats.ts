export interface GitHubLanguageStat {
  language: string;
  repositories: number;
}

export interface GitHubRepositoryStats {
  username: string;
  analyzedRepositories: number;
  totalStars: number;
  totalForks: number;
  languages: GitHubLanguageStat[];
  truncated: boolean;
}