"use client";

import { Icon } from "@/components/icons";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-button"
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      title={theme === "dark" ? "Açık tema" : "Koyu tema"}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
      {!compact && <span>{theme === "dark" ? "Açık tema" : "Koyu tema"}</span>}
    </button>
  );
}
