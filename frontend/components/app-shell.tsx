"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/api";

type CurrentUser = { id: number; login: string; name?: string; avatar_url: string; html_url: string };
type AuthResponse = { authenticated: boolean; user: CurrentUser | null };

const nav = [
  { href: "/", label: "Overview" },
  { href: "/my-repositories", label: "My repositories" },
  { href: "/repositories", label: "Explore GitHub" },
  { href: "/profile", label: "Profiles" },
  { href: "/readme-builder", label: "README builder" },
  { href: "/drafts", label: "Saved drafts" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const pageTitle = nav.find((item) => item.href === pathname)?.label ?? "DevHub";

  useEffect(() => {
    apiFetch<AuthResponse>("/api/auth/me").then((result) => setUser(result.user)).catch(() => setUser(null)).finally(() => setAuthChecked(true));
  }, []);

  async function logout() {
    setBusy(true);
    try { await apiFetch("/api/auth/logout", { method: "POST" }); setUser(null); }
    catch (error) { window.alert(error instanceof Error ? error.message : "Çıkış yapılamadı."); }
    finally { setBusy(false); }
  }

  return <div className="simple-app">
    <header className="simple-header">
      <Link href="/" className="simple-brand">DevHub</Link>
      <nav className="simple-nav" aria-label="Ana menü">
        {nav.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "simple-nav-active" : ""}>{item.label}</Link>)}
      </nav>
      <div className="simple-account">
        {user ? <><Image className="account-avatar" src={user.avatar_url} alt="" width={27} height={27} unoptimized /><a href={user.html_url} target="_blank" rel="noreferrer">@{user.login}</a><button className="button button-light" onClick={logout} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button></> : <a className="button button-dark" href={`${getApiBaseUrl()}/api/auth/github`}>{authChecked ? "Sign in with GitHub" : "GitHub sign in"}</a>}
      </div>
    </header>
    <main className="simple-main"><div className="simple-page-title"><div><p className="eyebrow">DEVHUB</p><h1>{pageTitle}</h1></div></div>{children}</main>
    <footer className="simple-footer">DevHub · GitHub repository tools</footer>
  </div>;
}
