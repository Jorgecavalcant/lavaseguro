export type Theme = "light" | "dark";

const KEY = "ls_theme";

function isTheme(v: string | null): v is Theme {
  return v === "light" || v === "dark";
}

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(KEY);
    return isTheme(stored) ? stored : "light";
  } catch {
    return "light";
  }
}

export function setTheme(t: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, t);
  } catch {
    // ignore
  }
  document.documentElement.dataset.theme = t;
  document.documentElement.style.colorScheme = t;
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function applyTheme(): void {
  setTheme(getTheme());
}
