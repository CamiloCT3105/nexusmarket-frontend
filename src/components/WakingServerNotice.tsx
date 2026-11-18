import { useEffect, useState } from "react";

// En el plan gratuito el backend se duerme tras un rato sin uso y tarda cerca de un minuto en despertar.
// Se monta solo mientras se espera una respuesta: si la espera pasa de unos segundos, lo explica
// en lugar de dejar una pantalla que parece congelada.
export function WakingServerNotice({ delayMs = 5000 }: { delayMs?: number }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!slow) return null;
  return (
    <p role="status" className="text-center text-sm text-muted">
      El servidor se está activando después de un rato sin uso. Puede tardar hasta un minuto; no hace falta recargar.
    </p>
  );
}
