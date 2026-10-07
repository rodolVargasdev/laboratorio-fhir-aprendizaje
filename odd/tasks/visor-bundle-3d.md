# Visor 3D de Bundle FHIR

## Objetivo
Mostrar en el laboratorio el grafo de recursos y referencias de la respuesta FHIR, para que el
estudiante vea que trae `_include` / `_revinclude` y como se enlazan los recursos.

## Problema y porque
Un Bundle en JSON se lee lineal; las referencias (`Reference.reference`) quedan ocultas.
El grafo es la dimension que el texto no muestra (temas 04, 05 y 11).

## Alcance
- Modulo puro que extrae nodos y aristas de un Bundle o recurso.
- Visor three.js con layout de fuerzas propio, clic en nodo para ver su JSON.
- Pestanas JSON | Grafo en `FhirPlayground`; lista accesible como alternativa y sin WebGL.
- Fuera de alcance: edicion, servidores distintos de HAPI, persistencia.

## Restricciones
- Solo `three` como dependencia nueva (ver `plataforma/docs/STACK_TECNOLOGICO.md`).
- Carga diferida (`ssr: false`); paleta azul/navy; sin emojis; textos sin voseo.

## TDD
Modo: desactivado (sin configuracion de proyecto). Runner para pruebas puras:
`node --import tsx --test` (tsx ya esta en devDependencies).

## Tareas
- [x] T1 Dependencia three + docs/STACK_TECNOLOGICO.md. Ruta: inline (mecanico).
- [x] T2 `lib/fhir-grafo.ts` + pruebas con contraprueba. Ruta: delegada (writer, 3 archivos no triviales).
- [x] T3 `components/visor-bundle-3d.tsx` (three, fuerzas, raycast, etiquetas, fallback). Ruta: delegada.
- [x] T4 Integracion en `fhir-playground.tsx` + reto nuevo en laboratorio. Ruta: delegada.
- [x] T5 Verificacion en navegador (lint, build, preview). Ruta: inline.
- [ ] T6 Correccion de hallazgos de revision (5). Ruta: delegada (writer, 6 archivos no triviales).

## Criterios de aceptacion
- `Encounter?_count=1&_include=Encounter:patient` muestra 2 nodos y 1 arista.
- Una referencia a un recurso fuera del Bundle se dibuja como nodo externo (punteado/gris).
- Respuesta no FHIR o `metadata` sin referencias no rompe: mensaje claro.
- Lint y build en verde.

## Progreso
- T1: d081716 (three 0.186.1, @types/three 0.186.0, STACK_TECNOLOGICO.md).
- T2: 9cf65a0 (modulo, 11 pruebas, script npm test). Se agrego colorDeTipo a lib/fhir-grafo.ts para compartir la paleta con la leyenda.
- T3: e8ed43b (visor three, layout de fuerzas propio, fallback sin WebGL).
- T4: pestanas JSON y Grafo en fhir-playground, ejemplo y reto nuevo (4c0bd20).

- T5: verificado en navegador (escritorio y movil 375px) contra HAPI real, 2026-10-07.
  - Encounter + include: 2 nodos, 1 arista. Observation sin include: Patient compartido como externo.
  - Clic en nodo muestra su JSON. Sin errores de consola tras recarga limpia.
  - Correcciones: la rueda sola desplaza la pagina y el zoom pide Ctrl/Cmd; touch-action pan-y; encuadre con el FOV
    horizontal real (antes cortaba etiquetas en movil); nombres largos acortados (prueba 12);
    plural del contador; pista de zoom oculta en pantallas tactiles.
  - Repetible vs manual: la regla del gate (sin modificador no hace zoom; ctrl o meta si) es
    repetible por prueba unitaria (lib/visor-entrada.test.ts, T6). Fue manual, en navegador el
    2026-10-07: el preventDefault real de OrbitControls, el clic en nodo y el aviso sin WebGL.
  - Checks: npm test 12/12, tsc sin errores, build de produccion OK, lint con 5 problemas
    previos en paso-notebooklm.tsx y sr.ts (ninguno en archivos de esta feature).

- Revision RDD: riesgo medio, aprobada y acusada (lineage review-f4861cb4ce32e70c). Hallazgos no
  bloqueantes: seleccion desincronizada al cambiar de pestana, tope de 200 nodos silencioso,
  sin reencuadre al redimensionar, glob de npm test exige Node 21+. Listados en el PR.
- PR: https://github.com/rodolVargasdev/laboratorio-fhir-aprendizaje/pull/7

- T6: corrige los cuatro hallazgos de arriba mas la contraprueba del zoom.
  1. Seleccion: el visor acepta `seleccionId` y un clic en vacio siempre llama onSeleccion(null);
     el playground pasa el id y limpia la seleccion al llegar una respuesta nueva.
  2. Tope: GrafoFhir agrega `truncado` y `referenciasOmitidas`; la UI muestra "Grafo recortado" y
     nunca "Sin referencias" si hay omitidas; la prueba del tope ahora tiene aristas reales.
  3. Reencuadre al redimensionar cuando el layout ya termino.
  4. `npm test` lista los archivos de prueba (sin glob, valido en Node 20) y package.json declara
     `engines.node >=20.9`.
  5. Regla de zoom extraida a lib/visor-entrada.ts con prueba y contraprueba.
  Checks: npm test 16/16, tsc sin errores, lint con los 5 problemas previos y ninguno nuevo.
  Commit: (pendiente)

## Siguiente paso
Revision, fusion y despliegue a Cloud Run.
