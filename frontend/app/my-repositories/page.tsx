"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { MarkdownPreview } from "@/components/markdown-preview";

type Repository = {
  id: number; name: string; full_name: string; description: string | null; private: boolean;
  html_url: string; default_branch: string; updated_at: string; language: string | null;
  stargazers_count: number; forks_count: number; can_push: boolean;
};
type User = { login: string; name?: string; avatar_url: string; html_url: string };
type AuthResponse = { authenticated: boolean; user: User | null };
type RepoResponse = { data: Repository[] };
type ReadmeResponse = { data: { path: string; sha: string; content: string; html_url: string } };
type SaveResponse = { message: string; data: { sha?: string; commit_sha?: string; html_url?: string } };

export default function MyRepositoriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selected, setSelected] = useState<Repository | null>(null);
  const [readme, setReadme] = useState("");
  const [sha, setSha] = useState("");
  const [commitMessage, setCommitMessage] = useState("Update README via DevHub");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingReadme, setLoadingReadme] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const auth = await apiFetch<AuthResponse>("/api/auth/me");
      setUser(auth.user);
      if (!auth.authenticated) { setRepos([]); setSelected(null); return; }
      const result = await apiFetch<RepoResponse>("/api/account/repos");
      setRepos(result.data ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Repolar yüklenemedi.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // Load the current session from the backend after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("authError");
    // The callback query string is an external browser state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (message) setError(message);
    if (params.get("connected") === "1") setNotice("GitHub hesabın bağlandı.");
  }, []);

  async function selectRepo(repo: Repository) {
    setSelected(repo); setLoadingReadme(true); setError(""); setNotice(""); setReadme(""); setSha("");
    try {
      const [owner, repoName] = repo.full_name.split("/");
      const result = await apiFetch<ReadmeResponse>(`/api/account/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/readme`);
      setReadme(result.data.content); setSha(result.data.sha);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "README yüklenemedi.";
      if (message.toLowerCase().includes("not found") || message.includes("404")) setError("Bu repoda README.md bulunamadı. İçerik yazarak yeni README oluşturabilir ve kaydedebilirsin.");
      else setError(message);
    } finally { setLoadingReadme(false); }
  }

  async function saveReadme() {
    if (!selected) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const [owner, repo] = selected.full_name.split("/");
      const result = await apiFetch<SaveResponse>(`/api/account/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`, {
        method: "PUT", body: JSON.stringify({ content: readme, sha: sha || undefined, message: commitMessage }),
      });
      if (result.data.sha) setSha(result.data.sha);
      setNotice(`${result.message}${result.data.html_url ? " README dosyasını GitHub'da açabilirsin." : ""}`);
      if (result.data.html_url) window.open(result.data.html_url, "_blank", "noopener,noreferrer");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "README kaydedilemedi."); }
    finally { setSaving(false); }
  }

  const filteredRepos = useMemo(() => repos.filter((repo) => `${repo.full_name} ${repo.description ?? ""}`.toLowerCase().includes(filter.toLowerCase())), [repos, filter]);

  return <div className="managed-page">
    <p className="page-description" style={{ margin: "-12px 0 20px" }}>GitHub hesabını bağla, repolarını seç ve README dosyalarını doğrudan GitHub&apos;a commit et.</p>
    {error && <div className="error-message" role="alert">{error}</div>}
    {notice && <div className="success-message" role="status">{notice}</div>}

    {!loading && !user ? <section className="panel"><div className="panel-body" style={{ padding: 28 }}><h2 style={{ marginTop: 0 }}>GitHub hesabını bağla</h2><p className="page-description">Kendi repolarını listelemek ve README dosyalarını değiştirmek için GitHub ile giriş yapmalısın.</p><a className="button button-dark" style={{ marginTop: 16 }} href={`${getApiBaseUrl()}/api/auth/github`}>Sign in with GitHub</a></div></section> : null}

    {loading ? <section className="panel"><div className="panel-body">GitHub hesabın ve repoların yükleniyor…</div></section> : null}

    {user && !loading ? <div className="managed-layout">
      <section className="panel repo-picker">
        <div className="panel-header"><div><h2 className="panel-title">Your repositories</h2><p className="panel-subtitle">{repos.length} repo · en son güncellenenler</p></div><button className="btn-secondary" onClick={() => void load()}>Refresh</button></div>
        <div className="panel-body"><label className="field-label" htmlFor="repo-filter">Search repositories</label><input className="field-input" id="repo-filter" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Repo adı veya açıklama" /></div>
        <div className="managed-repo-list">{filteredRepos.map((repo) => <button type="button" key={repo.id} className={`managed-repo ${selected?.id === repo.id ? "managed-repo-active" : ""}`} onClick={() => void selectRepo(repo)}><span className="managed-repo-title">{repo.name}</span><span className="managed-repo-meta">{repo.private ? "Private" : "Public"} · {repo.language || "Dil yok"}</span><span className="managed-repo-desc">{repo.description || "Açıklama eklenmemiş."}</span>{!repo.can_push && <span className="badge">Read-only</span>}</button>)}{filteredRepos.length === 0 && <div className="panel-body page-description">Eşleşen repo bulunamadı.</div>}</div>
      </section>

      <section className="panel readme-editor-panel">
        <div className="panel-header"><div><h2 className="panel-title">README editor</h2><p className="panel-subtitle">{selected ? selected.full_name : "Düzenlemek için bir repo seç"}</p></div>{selected && <a className="button" href={selected.html_url} target="_blank" rel="noreferrer">GitHub&apos;da aç</a>}</div>
        {!selected ? <div className="empty-state"><h3>Bir repo seç</h3><p>Sol taraftan bir depo seçtiğinde README içeriği burada açılır.</p></div> : loadingReadme ? <div className="panel-body">README yükleniyor…</div> : <>
          <div className="panel-body readme-controls"><label className="field-label" htmlFor="commit-message">Commit message</label><input id="commit-message" className="field-input" value={commitMessage} onChange={(event) => setCommitMessage(event.target.value)} maxLength={200} /><p className="panel-subtitle">Branch: {selected.default_branch}. Kaydetmek GitHub üzerinde doğrudan commit oluşturur.</p>{!selected.can_push && <div className="info-message">Bu depoda yazma izni görünmüyor; kaydetme isteği GitHub tarafından reddedilebilir.</div>}</div>
          <div className="editor-topline">README.md · Markdown</div>
          <textarea className="editor-textarea" aria-label="README Markdown içeriği" value={readme} onChange={(event) => setReadme(event.target.value)} spellCheck={false} />
          <div className="panel-header"><span className="panel-subtitle">Live preview</span><button className="btn-primary" type="button" onClick={() => void saveReadme()} disabled={saving || !selected.can_push}>{saving ? "GitHub'a kaydediliyor…" : "Commit README"}</button></div>
          <div className="markdown-preview"><MarkdownPreview content={readme} /></div>
        </>}
      </section>
    </div> : null}
  </div>;
}
