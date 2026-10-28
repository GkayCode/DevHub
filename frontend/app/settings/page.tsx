"use client";

import { FormEvent, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { apiFetch, getApiBaseUrl, saveApiBaseUrl } from "@/lib/api";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [apiUrl, setApiUrl] = useState("http://localhost:5000");
  const [status, setStatus] = useState<"idle" | "checking" | "connected" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Read a browser-only setting after hydration to avoid server/client mismatches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiUrl(getApiBaseUrl());
  }, []);

  async function testConnection(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!apiUrl.trim()) { setMessage("API adresi boş olamaz."); setStatus("error"); return; }
    saveApiBaseUrl(apiUrl); setStatus("checking"); setMessage("");
    try {
      const result = await apiFetch<{ success: boolean; database: string }>("/api/health");
      setStatus("connected");
      setMessage(`API yanıt verdi. MongoDB durumu: ${result.database || "bilinmiyor"}.`);
    } catch (cause) { setStatus("error"); setMessage(cause instanceof Error ? cause.message : "API bağlantısı kurulamadı."); }
  }

  function resetApi() { setApiUrl("http://localhost:5000"); saveApiBaseUrl(""); setStatus("idle"); setMessage("Varsayılan API adresi geri yüklendi."); }

  return <div>
    <div className="page-heading"><div><div className="eyebrow"><Icon name="settings" size={14} /> Workspace preferences</div><h1 className="page-title">Settings</h1><p className="page-description">Adjust your local DevHub experience and connection settings.</p></div></div>
    <div className="two-column" style={{ alignItems: "start" }}>
      <section className="panel"><div className="panel-header"><div><h2 className="panel-title">Appearance</h2><p className="panel-subtitle">Choose the visual mode that works for you.</p></div><Icon name="sun" size={17} className="text-muted" /></div><div className="panel-body">
        <div className="settings-row"><div><h3>Color theme</h3><p>Switch between a dark workspace and a light theme. Your choice is saved in this browser.</p></div><ThemeToggle /></div>
        <div style={{ display: "flex", gap: 10, marginTop: 17 }}><button className={`template-card ${theme === "dark" ? "selected" : ""}`} type="button" onClick={() => setTheme("dark")} style={{ flex: 1, padding: 13 }}><div style={{ height: 65, borderRadius: 7, background: "#10141d", border: "1px solid #303848", padding: 9, display: "flex", gap: 5 }}><span style={{ width: 18, borderRadius: 3, background: "#202938" }} /><span style={{ flex: 1, borderRadius: 3, background: "#1b2330" }} /></div><div style={{ marginTop: 9, fontSize: 11, fontWeight: 700 }}>Dark</div></button><button className={`template-card ${theme === "light" ? "selected" : ""}`} type="button" onClick={() => setTheme("light")} style={{ flex: 1, padding: 13 }}><div style={{ height: 65, borderRadius: 7, background: "#f8fafc", border: "1px solid #d8e0eb", padding: 9, display: "flex", gap: 5 }}><span style={{ width: 18, borderRadius: 3, background: "#e3e9f2" }} /><span style={{ flex: 1, borderRadius: 3, background: "#ffffff" }} /></div><div style={{ marginTop: 9, fontSize: 11, fontWeight: 700 }}>Light</div></button></div>
      </div></section>
      <section className="panel"><div className="panel-header"><div><h2 className="panel-title">Backend connection</h2><p className="panel-subtitle">Connect the frontend to your Express API.</p></div><Icon name="database" size={17} className="text-muted" /></div><div className="panel-body"><form onSubmit={testConnection}><label className="field-label" htmlFor="api-url">API base URL</label><input className="field-input" id="api-url" value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} placeholder="http://localhost:5000" /><p className="panel-subtitle" style={{ margin: "8px 0 16px" }}>Used for GitHub lookups, README templates and saved drafts. The value is stored in local browser storage.</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn-primary" type="submit" disabled={status === "checking"}><Icon name="activity" size={14} />{status === "checking" ? "Testing…" : "Save & test"}</button><button className="btn-secondary" type="button" onClick={resetApi}>Reset default</button></div></form>{message && <div className={status === "connected" ? "success-message" : status === "error" ? "error-message" : "info-message"} style={{ marginTop: 15 }}><Icon name={status === "connected" ? "check" : status === "error" ? "alert" : "activity"} size={15} />{message}</div>}</div></section>
    </div>
    <section className="panel" style={{ marginTop: 17 }}><div className="panel-header"><div><h2 className="panel-title">About this workspace</h2><p className="panel-subtitle">Current stack and implementation notes.</p></div><span className="badge badge-accent">DevHub</span></div><div className="panel-body"><div className="settings-row"><div><h3>Frontend</h3><p>Next.js App Router, React, TypeScript, Tailwind CSS.</p></div><span className="badge">Next.js</span></div><div className="settings-row"><div><h3>Backend</h3><p>Express API with GitHub public endpoints and MongoDB-backed README templates/drafts.</p></div><span className="badge">Express + MongoDB</span></div><div className="settings-row"><div><h3>GitHub integration</h3><p>GitHub App sign-in and repository README commits are available after backend/.env is configured. Saved README drafts remain a separate workspace feature.</p></div><span className="badge" style={{ color: "var(--red)" }}>Configure .env</span></div></div></section>
  </div>;
}
