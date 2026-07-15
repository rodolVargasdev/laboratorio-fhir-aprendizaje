/**
 * Lista blanca de correos autorizados (~5 usuarios). Se define en la variable de
 * entorno AUTH_ALLOWLIST como correos separados por coma. Si esta vacia, se
 * rechaza todo (fail-closed) salvo en desarrollo con login de prueba.
 */
export function correosPermitidos(): string[] {
  return (process.env.AUTH_ALLOWLIST ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

export function esCorreoPermitido(email?: string | null): boolean {
  if (!email) return false;
  const lista = correosPermitidos();
  if (lista.length === 0) return false;
  return lista.includes(email.trim().toLowerCase());
}
