export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  location: string | null;
  blog: string | null;
  created_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  topics: string[];
}

export interface GitHubRepositoryStats {
  username: string;
  analyzedRepositories: number;
  totalStars: number;
  totalForks: number;
  languages: { language: string; repositories: number }[];
  truncated: boolean;
}

export interface ReadmeTemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  content?: string;
}

export interface ReadmeDraft {
  _id: string;
  title: string;
  content: string;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubSearchResponse {
  success: boolean;
  count: number;
  total_count: number;
  page: number;
  per_page: number;
  data: GitHubRepository[];
}
