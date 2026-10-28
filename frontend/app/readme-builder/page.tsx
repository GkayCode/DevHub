"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { MarkdownPreview } from "@/components/markdown-preview";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, ReadmeDraft, ReadmeTemplate } from "@/lib/types";

export default function ReadmeBuilderPage() {
  const [templates, setTemplates] = useState<ReadmeTemplate[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [draftId, setDraftId] = useState("");
  const [title, setTitle] = useState("My README");
  const [content, setContent] = useState("# My README\n\nStart writing your developer story here.");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadTemplate = useCallback(async (id: string) => {
    setError(""); setNotice("");
    try {
      const result = await apiFetch<ApiResponse<ReadmeTemplate>>(`/api/readme-templates/${encodeURIComponent(id)}`);
      setTemplateId(result.data.templateId);
      setTitle(result.data.name || "My README");
      setContent(result.data.content || "");
      setDraftId("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Şablon yüklenemedi."); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      setLoadingTemplates(true);
      try {
        const result = await apiFetch<ApiResponse<ReadmeTemplate[]>>("/api/readme-templates");
        if (cancelled) return;
        const available = result.data ?? [];
        setTemplates(available);
        const params = new URLSearchParams(window.location.search);
        const existingDraftId = params.get("draft");
        if (existingDraftId) {
          const draftResult = await apiFetch<ApiResponse<ReadmeDraft>>(`/api/readme-drafts/${encodeURIComponent(existingDraftId)}`);
          if (cancelled) return;
          setDraftId(draftResult.data._id);
          setTitle(draftResult.data.title);
          setContent(draftResult.data.content);
          setTemplateId(draftResult.data.templateId || "");
        } else if (available.length) {
          const first = await apiFetch<ApiResponse<ReadmeTemplate>>(`/api/readme-templates/${encodeURIComponent(available[0].templateId)}`);
          if (cancelled) return;
          setTemplateId(first.data.templateId);
          setTitle(first.data.name || "My README");
          setContent(first.data.content || "");
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Şablonlar yüklenemedi. Backend çalışıyor mu?");
      } finally { if (!cancelled) setLoadingTemplates(false); }
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);

  async function saveDraft(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!title.trim()) { setError("Taslak başlığı boş olamaz."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = { title: title.trim(), content, templateId: templateId || null };
      const result = draftId
        ? await apiFetch<ApiResponse<ReadmeDraft>>(`/api/readme-drafts/${encodeURIComponent(draftId)}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await apiFetch<ApiResponse<ReadmeDraft>>("/api/readme-drafts", { method: "POST", body: JSON.stringify(payload) });
      setDraftId(result.data._id);
      setNotice("Taslak MongoDB'ye kaydedildi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Taslak kaydedilemedi."); }
    finally { setSaving(false); }
  }

  async function copyContent() {
    try { await navigator.clipboard.writeText(content); setNotice("Markdown panoya kopyalandı."); setError(""); }
    catch { setError("Panoya erişilemedi. İçeriği editörden elle kopyalayabilirsin."); }
  }

  function downloadContent() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "README.md"; anchor.click();
    URL.revokeObjectURL(url);
    setNotice("README.md dosyası indirilmeye hazırlandı.");
  }

  return <div>
    <div className="page-heading"><div><div className="eyebrow"><Icon name="file" size={14} /> Markdown studio</div><h1 className="page-title">README Builder</h1><p className="page-description">Choose a starting point, write in Markdown and preview the result side by side. Save drafts to continue later.</p></div><span className="badge badge-accent"><Icon name="sparkles" size={12} /> Live preview</span></div>

    <section className="panel" style={{ marginBottom: 17 }}><div className="panel-header"><div><h2 className="panel-title">Start from a template</h2><p className="panel-subtitle">Templates are loaded from your DevHub API.</p></div>{loadingTemplates ? <span className="badge">Loading…</span> : <span className="badge">{templates.length} templates</span>}</div><div className="panel-body"><div className="template-grid">{templates.map((template) => <button key={template.templateId} type="button" onClick={() => void loadTemplate(template.templateId)} className={`template-card ${templateId === template.templateId && !draftId ? "selected" : ""}`}><span className="template-card-icon"><Icon name={template.category.toLowerCase().includes("portfolio") ? "user" : template.category.toLowerCase().includes("open") ? "github" : "file"} size={18} /></span><h3>{template.name}</h3><p>{template.description}</p><div className="template-card-footer"><span>{template.category}</span><span>{templateId === template.templateId && !draftId ? "Selected ✓" : "Use template →"}</span></div></button>)}</div>{!loadingTemplates && templates.length === 0 && <div className="empty-state"><div className="empty-state-icon"><Icon name="file" size={22} /></div><h3>No templates found</h3><p>Start the backend and check that MongoDB is connected and the default templates were seeded.</p></div>}</div></section>

    <form onSubmit={saveDraft}>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 13 }}><div style={{ flex: "1 1 260px", maxWidth: 450 }}><label htmlFor="readme-title" className="field-label">Draft title</label><input id="readme-title" className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="My developer README" /></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn-secondary" type="button" onClick={() => void copyContent()}><Icon name="copy" size={14} />Copy Markdown</button><button className="btn-secondary" type="button" onClick={downloadContent}><Icon name="download" size={14} />Download .md</button><button className="btn-primary" type="submit" disabled={saving || !content.trim()}><Icon name="save" size={14} />{saving ? "Saving…" : draftId ? "Update draft" : "Save draft"}</button></div></div>
      {error && <div className="error-message" style={{ marginBottom: 12 }}><Icon name="alert" size={15} />{error}</div>}
      {notice && <div className="success-message" style={{ marginBottom: 12 }}><Icon name="check" size={15} />{notice}</div>}
      <div className="builder-layout">
        <section className="panel" style={{ overflow: "hidden" }}><div className="editor-topline"><span style={{ display: "flex", alignItems: "center", gap: 9 }}><span className="editor-dots"><span /><span /><span /></span><Icon name="code" size={14} /> README.md</span><span>{content.length.toLocaleString("tr-TR")} chars</span></div><textarea className="editor-textarea" value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} aria-label="README Markdown editor" placeholder="# Project title" /></section>
        <section className="panel" style={{ overflow: "hidden" }}><div className="editor-topline"><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="eye" size={14} /> Live preview</span><span className="badge">Markdown</span></div><div style={{ maxHeight: 590, overflow: "auto" }}><MarkdownPreview content={content} /></div></section>
      </div>
    </form>
    <div className="info-message" style={{ marginTop: 16 }}><Icon name="database" size={15} />Saved drafts currently use the local backend database. Authentication is not implemented yet, so run this app only in a trusted development environment.</div>
  </div>;
}
