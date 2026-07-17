/**
 * Estado de carga del grupo autenticado. Aparece al instante en cada navegacion
 * mientras el servidor renderiza la pagina (streaming). Ademas, tener este limite
 * de carga permite que Next prefetchee las rutas dinamicas, haciendo la navegacion
 * mucho mas fluida. Es un esqueleto neutro que sirve para panel, tema, admin, etc.
 */
export default function Cargando() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Cargando">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
