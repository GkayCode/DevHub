"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, ReadmeDraft } from "@/lib/types";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<ReadmeDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDrafts = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await apiFetch<ApiResponse<ReadmeDraft[]>>("/api/readme-drafts"); setDrafts(result.data ?? []); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Taslaklar yüklenemedi."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // Initial load is an external API synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDrafts();
  }, [loadDrafts]);

  async function deleteDraft(id: string) {
    if (!window.confirm("Bu README taslağını silmek istediğine emin misin?")) return;
    setError(""); setNotice("");
    try { await apiFetch<{ success: boolean }>(`/api/readme-drafts/${encodeURIComponent(id)}`, { method: "DELETE" }); setDrafts((current) => current.filter((draft) => draft._id !== id)); setNotice("Taslak silindi."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Taslak silinemedi."); }
  }

  async function copyDraft(content: string) {
    try { await navigator.clipboard.writeText(content); setNotice("Markdown panoya kopyalandı."); setError(""); }
    catch { setError("Panoya erişilemedi."); }
  }

  function downloadDraft(draft: ReadmeDraft) {
    const blob = new Blob([draft.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${draft.title.trim().replace(/[^a-z0-9-_]+/gi, "-") || "README"}.md`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div>
    <div className="page-heading"><div><div className="eyebrow"><Icon name="layers" size={14} /> Your workspace</div><h1 className="page-title">Saved drafts</h1><p className="page-description">Pick up where you left off. Open a draft in the editor, download it as Markdown or remove old versions.</p></div><Link href="/readme-builder" className="btn-primary"><Icon name="plus" size={15} />New README</Link></div>
    {error && <div className="error-message" style={{ marginBottom: 15 }}><Icon name="alert" size={15} />{error}</div>}
    {notice && <div className="success-message" style={{ marginBottom: 15 }}><Icon name="check" size={15} />{notice}</div>}
    <section className="panel"><div className="panel-header"><div><h2 className="panel-title">Your README drafts</h2><p className="panel-subtitle">{loading ? "Loading saved drafts…" : `${drafts.length} saved ${drafts.length === 1 ? "draft" : "drafts"}`}</p></div><button type="button" className="btn-secondary" onClick={() => void loadDrafts()} disabled={loading}><Icon name="refresh" size={14} />Refresh</button></div>
      {loading ? <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 13 }}>{[1, 2, 3].map((n) => <div key={n} className="draft-card" style={{ display: "grid", gap: 10 }}><div className="loading-line" style={{ width: "60%" }} /><div className="loading-line" /><div className="loading-line" style={{ width: "80%" }} /></div>)}</div> : drafts.length ? <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 13 }}>{drafts.map((draft) => <article key={draft._id} className="draft-card"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}><div style={{ minWidth: 0 }}><h3>{draft.title}</h3><div style={{ marginTop: 6, color: "var(--muted)", fontSize: 10 }}>{draft.templateId || "Custom README"} · Updated {new Date(draft.updatedAt).toLocaleDateString("tr-TR")}</div></div><span className="template-card-icon"><Icon name="file" size={16} /></span></div><p>{draft.content.slice(0, 210)}{draft.content.length > 210 ? "…" : ""}</p><div className="draft-card-actions"><Link href={`/readme-builder?draft=${encodeURIComponent(draft._id)}`} className="btn-primary"><Icon name="file" size={13} />Edit draft</Link><button className="btn-secondary" type="button" onClick={() => void copyDraft(draft.content)} aria-label="Copy draft"><Icon name="copy" size={13} /></button><button className="btn-secondary" type="button" onClick={() => downloadDraft(draft)} aria-label="Download draft"><Icon name="download" size={13} /></button><button className="btn-danger" type="button" onClick={() => void deleteDraft(draft._id)} aria-label="Delete draft"><Icon name="trash" size={13} /></button></div></article>)}</div> : <div className="empty-state"><div className="empty-state-icon"><Icon name="file" size={23} /></div><h3>No saved drafts yet</h3><p>Create a README from a template, edit the Markdown and save it to find it here later.</p><Link href="/readme-builder" className="btn-primary" style={{ marginTop: 17 }}><Icon name="plus" size={14} />Create your first README</Link></div>}
    </section>
    <div className="info-message" style={{ marginTop: 15 }}><Icon name="alert" size={15} />Drafts are currently stored in the connected MongoDB without user authentication. Do not expose this development API publicly.</div>
  </div>;
}
