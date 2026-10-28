"use client";

import Image from "next/image";

import { FormEvent, useState } from "react";
import { Icon } from "@/components/icons";
import { apiFetch, formatNumber } from "@/lib/api";
import type { ApiResponse, GitHubRepositoryStats, GitHubUser } from "@/lib/types";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<GitHubUser | null>(null);
  const [stats, setStats] = useState<GitHubRepositoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = username.trim().replace(/^@/, "");
    if (!value) { setError("GitHub kullanıcı adını gir."); return; }
    setLoading(true); setError("");
    try {
      const [profileResponse, statsResponse] = await Promise.all([
        apiFetch<ApiResponse<GitHubUser>>(`/api/github/${encodeURIComponent(value)}`),
        apiFetch<ApiResponse<GitHubRepositoryStats>>(`/api/github-stats/${encodeURIComponent(value)}`),
      ]);
      setProfile(profileResponse.data); setStats(statsResponse.data);
    } catch (cause) { setProfile(null); setStats(null); setError(cause instanceof Error ? cause.message : "Profil alınamadı."); }
    finally { setLoading(false); }
  }

  return <div>
    <div className="page-heading"><div><div className="eyebrow"><Icon name="user" size={14} /> Profile analytics</div><h1 className="page-title">GitHub profile</h1><p className="page-description">Review public profile details, community reach and repository-level statistics.</p></div></div>
    <section className="panel"><div className="panel-body"><form onSubmit={lookup} style={{ display: "flex", gap: 9, maxWidth: 700 }}><div className="search-field" style={{ flex: 1 }}><Icon name="github" size={17} /><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter a GitHub username" aria-label="GitHub username" /></div><button className="btn-primary" type="submit" disabled={loading}>{loading ? "Loading…" : "Load profile"}<Icon name="arrow-right" size={14} /></button></form>{error && <div className="error-message" style={{ marginTop: 13 }}><Icon name="alert" size={15} />{error}</div>}</div></section>
    {profile && stats ? <>
      <section className="panel" style={{ marginTop: 18 }}><div className="profile-header"><Image className="profile-avatar" src={profile.avatar_url} alt={`${profile.login} avatar`} width={72} height={72} unoptimized /><div style={{ minWidth: 0, flex: 1 }}><h2 className="profile-name">{profile.name || profile.login}</h2><a href={profile.html_url} className="profile-login" target="_blank" rel="noreferrer">@{profile.login} <Icon name="arrow-up-right" size={12} /></a><p className="profile-bio">{profile.bio || "This user has not added a public bio."}</p><div className="profile-stats"><span><strong>{formatNumber(profile.followers)}</strong> followers</span><span><strong>{formatNumber(profile.following)}</strong> following</span><span><strong>{formatNumber(profile.public_repos)}</strong> repositories</span></div></div><a href={profile.html_url} target="_blank" rel="noreferrer" className="btn-secondary">Open GitHub <Icon name="external" size={13} /></a></div><div className="panel-body" style={{ display: "flex", flexWrap: "wrap", gap: 18, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--muted)" }}>{profile.location && <span><Icon name="globe" size={13} /> {profile.location}</span>}{profile.blog && <a href={profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`} target="_blank" rel="noreferrer"><Icon name="link" size={13} /> {profile.blog}</a>}<span><Icon name="clock" size={13} /> Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span></div></section>
      <div className="stat-grid"><Stat label="Public repositories" value={formatNumber(profile.public_repos)} icon="code" /><Stat label="Stars collected" value={formatNumber(stats.totalStars)} icon="star" /><Stat label="Total forks" value={formatNumber(stats.totalForks)} icon="git-fork" /><Stat label="Languages used" value={String(stats.languages.length)} icon="terminal" /></div>
      <div className="panel"><div className="panel-header"><div><h2 className="panel-title">Language distribution</h2><p className="panel-subtitle">Primary language per repository, based on analyzed repositories.</p></div></div><div className="panel-body">{stats.languages.length ? stats.languages.map((item, index) => <div key={item.language} style={{ marginBottom: 17 }}><div className="language-row"><span className="language-name"><i style={{ background: ["#a3e635", "#8da8ff", "#c4a7ff", "#f9a8d4", "#67e8f9"][index % 5] }} />{item.language}</span><strong>{item.repositories}</strong></div><div className="language-bar" style={{ margin: 0 }}><span style={{ width: `${Math.max(2, (item.repositories / Math.max(stats.analyzedRepositories, 1)) * 100)}%`, background: ["#a3e635", "#8da8ff", "#c4a7ff", "#f9a8d4", "#67e8f9"][index % 5] }} /></div></div>) : <div className="empty-state"><p>No language data available.</p></div>}{stats.truncated && <div className="info-message"><Icon name="alert" size={14} />Statistics cover the first 1,000 repositories only.</div>}</div></div>
    </> : <div className="panel" style={{ marginTop: 18 }}><div className="empty-state"><div className="empty-state-icon"><Icon name="user" size={23} /></div><h3>Look up a developer</h3><p>Enter a GitHub username to view their public profile and aggregate repository statistics.</p></div></div>}
  </div>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon: "code" | "star" | "git-fork" | "terminal" }) { return <div className="stat-card"><div className="stat-card-top">{label}<span className="stat-icon"><Icon name={icon} size={16} /></span></div><div className="stat-value">{value}</div><div className="stat-note">Public GitHub data</div></div>; }
