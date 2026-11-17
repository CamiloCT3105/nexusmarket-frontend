import { useEffect, useState } from "react";

// Devuelve el valor solo cuando deja de cambiar durante `delay` ms (búsqueda mientras se escribe)
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
