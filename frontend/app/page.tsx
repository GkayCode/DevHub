"use client";

import Image from "next/image";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { apiFetch, formatNumber, timeAgo } from "@/lib/api";
import type { ApiResponse, GitHubRepository, GitHubRepositoryStats, GitHubUser } from "@/lib/types";

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<GitHubUser | null>(null);
  const [stats, setStats] = useState<GitHubRepositoryStats | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [databaseStatus, setDatabaseStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");

  useEffect(() => {
    apiFetch<{ success: boolean; database: string }>("/api/health")
      .then((result) => {
        setApiStatus(result.success ? "connected" : "offline");
        setDatabaseStatus(result.database === "connected" ? "connected" : "disconnected");
      })
      .catch(() => { setApiStatus("offline"); setDatabaseStatus("unknown"); });
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanUsername) { setError("Önce bir GitHub kullanıcı adı gir."); return; }
    setLoading(true);
    setError("");
    try {
      const [profileResult, statsResult, repoResult] = await Promise.all([
        apiFetch<ApiResponse<GitHubUser>>(`/api/github/${encodeURIComponent(cleanUsername)}`),
        apiFetch<ApiResponse<GitHubRepositoryStats>>(`/api/github-stats/${encodeURIComponent(cleanUsername)}`),
        apiFetch<{ success: boolean; data: GitHubRepository[] }>(`/api/github/${encodeURIComponent(cleanUsername)}/repos?per_page=6&sort=updated`),
      ]);
      setProfile(profileResult.data);
      setStats(statsResult.data);
      setRepositories(repoResult.data ?? []);
    } catch (cause) {
      setProfile(null); setStats(null); setRepositories([]);
      setError(cause instanceof Error ? cause.message : "GitHub profili alınamadı.");
    } finally { setLoading(false); }
  }

  const topLanguage = stats?.languages?.[0]?.language ?? "—";

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Icon name="sparkles" size={14} /> Developer overview</div>
          <h1 className="page-title">Your workspace, <span style={{ color: "var(--accent)" }}>in focus.</span></h1>
          <p className="page-description">GitHub profilini keşfet, depolarını analiz et ve README çalışmalarını tek bir yerden yönet.</p>
        </div>
        <div className="badge"><span className="status-dot" /> API {apiStatus === "checking" ? "kontrol ediliyor" : apiStatus === "connected" ? "erişilebilir" : "bağlantı yok"}</div>
      </div>

      <section className="panel" style={{ padding: 20, background: "linear-gradient(115deg, var(--surface), color-mix(in srgb, var(--accent) 5%, var(--surface)))" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 470 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}><Icon name="github" size={14} /> GitHub explorer</div>
            <h2 style={{ margin: 0, fontSize: 18, letterSpacing: "-.4px" }}>Start with a GitHub username</h2>
            <p className="page-description" style={{ marginTop: 7, fontSize: 12 }}>Public profile details, repository activity and language statistics. No sign-in required for public data.</p>
          </div>
          <div style={{ minWidth: 230, color: "var(--muted)", fontSize: 10, lineHeight: 1.7 }}>Powered by the GitHub public API<br />Rate limits may apply to anonymous requests.</div>
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 9, marginTop: 18, maxWidth: 690 }}>
          <div className="search-field" style={{ flex: 1 }}><Icon name="search" size={17} /><input aria-label="GitHub username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. torvalds, gaearon, octocat" /></div>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Loading…" : "Explore profile"}<Icon name="arrow-right" size={15} /></button>
        </form>
        {error && <div className="error-message" style={{ marginTop: 12 }}><Icon name="alert" size={15} />{error}</div>}
      </section>

      {profile && stats ? <>
        <div className="profile-header panel" style={{ marginTop: 18 }}>
          {/* GitHub avatar URL comes from GitHub's public API. */}
          <Image className="profile-avatar" src={profile.avatar_url} alt={`${profile.login} avatar`} width={72} height={72} unoptimized />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 className="profile-name">{profile.name || profile.login}</h2>
            <a className="profile-login" href={profile.html_url} target="_blank" rel="noreferrer">@{profile.login} <Icon name="arrow-up-right" size={12} /></a>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stats"><span><strong>{formatNumber(profile.public_repos)}</strong> repositories</span><span><strong>{formatNumber(profile.followers)}</strong> followers</span><span><strong>{formatNumber(profile.following)}</strong> following</span></div>
          </div>
          <a className="btn-secondary" href={profile.html_url} target="_blank" rel="noreferrer">Open GitHub <Icon name="external" size={14} /></a>
        </div>
        <div className="stat-grid">
          <StatCard label="Public repositories" value={formatNumber(profile.public_repos)} note="Public repos on GitHub" icon="code" />
          <StatCard label="Stars collected" value={formatNumber(stats.totalStars)} note={stats.truncated ? "First 1,000 repositories" : "Across analyzed repositories"} icon="star" />
          <StatCard label="Total forks" value={formatNumber(stats.totalForks)} note="Across analyzed repositories" icon="git-fork" />
          <StatCard label="Top language" value={topLanguage} note={stats.languages[0] ? `${stats.languages[0].repositories} repositories` : "No language data"} icon="terminal" />
        </div>
        <div className="two-column">
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">Recently updated repositories</h2><p className="panel-subtitle">Latest public repositories for @{profile.login}</p></div><Link href="/repositories" className="btn-quiet">Explore all <Icon name="arrow-right" size={14} /></Link></div>
            <div className="repo-list">{repositories.length ? repositories.map((repo) => <RepositoryRow key={repo.id} repo={repo} />) : <div className="empty-state"><p>No public repositories found.</p></div>}</div>
          </section>
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">Language breakdown</h2><p className="panel-subtitle">Repositories grouped by primary language</p></div><Icon name="activity" size={17} className="text-muted" /></div>
            <div className="panel-body">
              {stats.languages.length ? <>
                <div className="language-bar">{stats.languages.slice(0, 7).map((language, index) => <span key={language.language} style={{ width: `${Math.max(4, (language.repositories / stats.analyzedRepositories) * 100)}%`, background: languageColors[index % languageColors.length] }} />)}</div>
                {stats.languages.slice(0, 7).map((language, index) => <div className="language-row" key={language.language}><span className="language-name"><i style={{ background: languageColors[index % languageColors.length] }} />{language.language}</span><strong>{language.repositories}</strong></div>)}
                {stats.truncated && <p className="panel-subtitle" style={{ marginTop: 15 }}>This account has more repositories; statistics are based on the first 1,000.</p>}
              </> : <div className="empty-state"><div className="empty-state-icon"><Icon name="terminal" size={22} /></div><h3>No language data</h3><p>GitHub has not provided primary language details for the analyzed repositories.</p></div>}
            </div>
          </section>
        </div>
      </> : <>
        <div className="stat-grid">
          <StatCard label="GitHub profiles" value="Explore" note="Public profile details" icon="user" />
          <StatCard label="Repository search" value="Discover" note="Filter by language and stars" icon="search-code" />
          <StatCard label="README Builder" value="Create" note="Edit with live preview" icon="file" />
          <StatCard label="Saved drafts" value="Organize" note="Continue your writing" icon="layers" />
        </div>
        <div className="two-column">
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">A good place to start</h2><p className="panel-subtitle">Explore the tools in your workspace</p></div><Icon name="sparkles" size={17} className="text-muted" /></div>
            <div className="repo-list">
              <FeatureRow icon="github" title="Explore a GitHub profile" description="Look up public stats, repositories and language distribution." href="/profile" action="Explore profile" />
              <FeatureRow icon="search-code" title="Find interesting repositories" description="Search GitHub projects and filter by language or popularity." href="/repositories" action="Search repos" />
              <FeatureRow icon="file" title="Build a polished README" description="Choose a template, edit Markdown and save your draft." href="/readme-builder" action="Open builder" />
            </div>
          </section>
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">System status</h2><p className="panel-subtitle">Local development services</p></div><Icon name="activity" size={17} className="text-muted" /></div>
            <div className="panel-body" style={{ display: "grid", gap: 13 }}>
              <StatusRow label="Frontend" detail="Next.js workspace" status="Online" />
              <StatusRow label="Backend API" detail="http://localhost:5000" status={apiStatus === "connected" ? "Reachable" : apiStatus === "checking" ? "Checking" : "Offline"} online={apiStatus === "connected"} />
              <StatusRow label="Database" detail="MongoDB connection via API" status={databaseStatus === "connected" ? "Connected" : databaseStatus === "disconnected" ? "Disconnected" : "Not verified"} online={databaseStatus === "connected"} />
              {apiStatus === "offline" && <div className="info-message"><Icon name="alert" size={15} />Start the backend with <code>npm run dev</code> from the backend folder. You can configure the API URL in Settings.</div>}
              <Link href="/settings" className="btn-secondary" style={{ width: "100%" }}>Configure workspace <Icon name="arrow-right" size={14} /></Link>
            </div>
          </section>
        </div>
      </>}
    </div>
  );
}

const languageColors = ["#a3e635", "#8da8ff", "#c4a7ff", "#f9a8d4", "#67e8f9", "#fdba74", "#fca5a5"];

function StatCard({ label, value, note, icon }: { label: string; value: string; note: string; icon: "code" | "star" | "git-fork" | "terminal" | "user" | "search-code" | "file" | "layers" }) {
  return <div className="stat-card"><div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={16} /></span></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

function RepositoryRow({ repo }: { repo: GitHubRepository }) {
  return <div className="repo-row"><div className="repo-icon"><Icon name="code" size={17} /></div><div className="repo-main"><div className="repo-name-line"><a className="repo-name" href={repo.html_url} target="_blank" rel="noreferrer">{repo.name}</a>{repo.fork && <span className="badge">Fork</span>}</div><p className="repo-description">{repo.description || "No description provided."}</p><div className="repo-meta">{repo.language && <span><i className="language-dot" />{repo.language}</span>}<span><Icon name="star" size={12} />{formatNumber(repo.stargazers_count)}</span><span><Icon name="git-fork" size={12} />{formatNumber(repo.forks_count)}</span><span><Icon name="clock" size={12} />{timeAgo(repo.updated_at)}</span></div></div><a className="icon-button" href={repo.html_url} target="_blank" rel="noreferrer" aria-label="Open repository"><Icon name="arrow-up-right" size={15} /></a></div>;
}

function FeatureRow({ icon, title, description, href, action }: { icon: "github" | "search-code" | "file"; title: string; description: string; href: string; action: string }) {
  return <div className="repo-row"><div className="repo-icon"><Icon name={icon} size={17} /></div><div className="repo-main"><h3 className="repo-name">{title}</h3><p className="repo-description">{description}</p><Link href={href} className="btn-quiet" style={{ paddingLeft: 0, minHeight: 25 }}>{action} <Icon name="arrow-right" size={13} /></Link></div></div>;
}

function StatusRow({ label, detail, status, online = true }: { label: string; detail: string; status: string; online?: boolean }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div><div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div><div style={{ color: "var(--muted)", fontSize: 10, marginTop: 4 }}>{detail}</div></div><span className="badge" style={{ color: online ? "var(--green)" : "var(--muted)" }}>{online && <span className="status-dot" />} {status}</span></div>;
}
