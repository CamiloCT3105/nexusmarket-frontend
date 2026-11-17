import { useCallback, useSyncExternalStore } from "react";

// Tema claro/oscuro. Vive en el atributo data-theme de <html> (index.html lo fija al cargar)
// y se recuerda en localStorage. Es una preferencia de cada navegador.

export type Theme = "light" | "dark";
const STORAGE_KEY = "nexus-theme";

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, current);

  const toggle = useCallback(() => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento (modo privado): el cambio dura hasta recargar
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { theme, toggle };
}
