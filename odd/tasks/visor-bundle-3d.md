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
- [ ] T5 Verificacion en navegador (lint, build, preview). Ruta: inline.

## Criterios de aceptacion
- `Encounter?_count=1&_include=Encounter:patient` muestra 2 nodos y 1 arista.
- Una referencia a un recurso fuera del Bundle se dibuja como nodo externo (punteado/gris).
- Respuesta no FHIR o `metadata` sin referencias no rompe: mensaje claro.
- Lint y build en verde.

## Progreso
- T1: commit pendiente de registro.
- T2: 9cf65a0 (modulo, 11 pruebas, script npm test). Se agrego colorDeTipo a lib/fhir-grafo.ts para compartir la paleta con la leyenda.
- T3: e8ed43b (visor three, layout de fuerzas propio, fallback sin WebGL).
- T4: pestanas JSON y Grafo en fhir-playground, ejemplo y reto nuevo (hash en el commit de T4).

## Siguiente paso
T5: verificacion en navegador.
