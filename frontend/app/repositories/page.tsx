"use client";

import { FormEvent, useState } from "react";
import { Icon } from "@/components/icons";
import { apiFetch, formatNumber, timeAgo } from "@/lib/api";
import type { GitHubRepository, GitHubSearchResponse } from "@/lib/types";

export default function RepositoriesPage() {
  const [query, setQuery] = useState("react");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("stars");
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function search(event?: FormEvent<HTMLFormElement>, nextPage = 1) {
    event?.preventDefault();
    if (query.trim().length < 2) { setError("Arama terimi en az 2 karakter olmalı."); return; }
    setLoading(true); setError("");
    const params = new URLSearchParams({ q: query.trim(), page: String(nextPage), per_page: "20", sort });
    if (language.trim()) params.set("language", language.trim());
    try {
      const result = await apiFetch<GitHubSearchResponse>(`/api/github/search/repos?${params.toString()}`);
      setRepos(result.data ?? []); setTotal(result.total_count ?? 0); setPage(nextPage); setSearched(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Repository araması başarısız."); setRepos([]); setSearched(true); }
    finally { setLoading(false); }
  }

  return <div>
    <div className="page-heading"><div><div className="eyebrow"><Icon name="search-code" size={14} /> GitHub discovery</div><h1 className="page-title">Repository explorer</h1><p className="page-description">Explore public projects across GitHub. Search by name, topic or keyword, then refine by language and popularity.</p></div><span className="badge"><Icon name="globe" size={12} /> Public repositories</span></div>
    <section className="panel">
      <div className="panel-header"><div><h2 className="panel-title">Search GitHub</h2><p className="panel-subtitle">Results are provided by the GitHub Search API.</p></div><span className="badge">{searched ? `${formatNumber(total)} results` : "Ready to search"}</span></div>
      <div className="panel-body">
        <form onSubmit={(event) => search(event, 1)} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(130px, .8fr) minmax(130px, .7fr) auto", gap: 10, alignItems: "end" }}>
          <div><label className="field-label" htmlFor="repo-query">Search terms</label><div className="search-field"><Icon name="search" size={16} /><input id="repo-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="react, nextjs, machine learning…" /></div></div>
          <div><label className="field-label" htmlFor="repo-language">Language</label><input className="field-input" id="repo-language" value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="TypeScript" /></div>
          <div><label className="field-label" htmlFor="repo-sort">Sort by</label><select className="field-select" id="repo-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="stars">Most stars</option><option value="forks">Most forks</option><option value="updated">Recently updated</option><option value="help-wanted-issues">Help wanted</option></select></div>
          <button className="btn-primary" type="submit" disabled={loading}><Icon name="search" size={15} />{loading ? "Searching…" : "Search"}</button>
        </form>
        {error && <div className="error-message" style={{ marginTop: 14 }}><Icon name="alert" size={15} />{error}</div>}
      </div>
    </section>

    <div className="panel" style={{ marginTop: 18 }}>
      <div className="panel-header"><div><h2 className="panel-title">Search results</h2><p className="panel-subtitle">{searched ? `Showing page ${page} · ${formatNumber(total)} matching repositories` : "Run a search to see repositories here."}</p></div><button className="btn-secondary" type="button" onClick={() => search(undefined, page)} disabled={loading || !searched}><Icon name="refresh" size={14} />Refresh</button></div>
      {loading ? <div className="panel-body" style={{ display: "grid", gap: 16 }}>{[1, 2, 3, 4].map((n) => <div key={n} style={{ display: "flex", gap: 12 }}><div className="loading-line" style={{ width: 36, height: 36 }} /><div style={{ flex: 1, display: "grid", gap: 8 }}><div className="loading-line" style={{ width: "35%" }} /><div className="loading-line" style={{ width: "72%" }} /></div></div>)}</div> : repos.length ? <>
        <div className="repo-list">{repos.map((repo) => <RepositoryItem key={repo.id} repo={repo} />)}</div>
        <div className="panel-header" style={{ borderTop: "1px solid var(--border)", borderBottom: 0 }}><span className="panel-subtitle">Page {page} · GitHub search provides up to 1,000 results.</span><div style={{ display: "flex", gap: 8 }}><button className="btn-secondary" type="button" disabled={page <= 1 || loading} onClick={() => search(undefined, page - 1)}><Icon name="chevron-left" size={14} />Previous</button><button className="btn-secondary" type="button" disabled={page * 20 >= Math.min(total, 1000) || loading} onClick={() => search(undefined, page + 1)}>Next<Icon name="chevron-right" size={14} /></button></div></div>
      </> : <div className="empty-state"><div className="empty-state-icon"><Icon name="search-code" size={23} /></div><h3>{searched ? "No repositories found" : "Search the open-source universe"}</h3><p>{searched ? "Try a broader keyword or remove the language filter." : "Enter a keyword above to discover repositories by stars, forks, update time or language."}</p></div>}
    </div>
  </div>;
}

function RepositoryItem({ repo }: { repo: GitHubRepository }) {
  return <div className="repo-row"><div className="repo-icon"><Icon name="code" size={17} /></div><div className="repo-main"><div className="repo-name-line"><a href={repo.html_url} className="repo-name" target="_blank" rel="noreferrer">{repo.full_name}</a>{repo.fork && <span className="badge">Fork</span>}{repo.private && <span className="badge">Private</span>}</div><p className="repo-description">{repo.description || "No description provided."}</p><div className="repo-meta">{repo.language && <span><i className="language-dot" />{repo.language}</span>}<span><Icon name="star" size={12} />{formatNumber(repo.stargazers_count)}</span><span><Icon name="git-fork" size={12} />{formatNumber(repo.forks_count)}</span><span><Icon name="clock" size={12} />{timeAgo(repo.updated_at)}</span>{repo.topics?.slice(0, 3).map((topic) => <span className="badge" key={topic}>{topic}</span>)}</div></div><a className="icon-button" href={repo.html_url} target="_blank" rel="noreferrer" aria-label="Open on GitHub"><Icon name="arrow-up-right" size={15} /></a></div>;
}
