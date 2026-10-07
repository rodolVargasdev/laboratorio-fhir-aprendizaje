// Reglas de entrada del visor 3D, separadas del componente para poder probarlas.

/** La rueda sola desplaza la pagina; el zoom del visor exige Ctrl o Cmd. */
export function zoomPermitido(e: { ctrlKey: boolean; metaKey: boolean }): boolean {
  return e.ctrlKey || e.metaKey;
}
