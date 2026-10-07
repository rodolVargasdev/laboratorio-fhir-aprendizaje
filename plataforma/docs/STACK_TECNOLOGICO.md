# Stack tecnologico de la plataforma

Versiones resueltas en `package-lock.json`. Toda dependencia nueva se agrega aqui en el
mismo commit que la incorpora, con su motivo y la alternativa descartada.

## Ejecucion

| paquete | version | para que |
|---|---|---|
| next | 16.2.10 | framework (App Router, standalone) |
| react / react-dom | 19.2.4 | interfaz |
| next-auth | 5.0.0-beta.31 | autenticacion (Google y contrasena) |
| @auth/prisma-adapter | 2.11.2 | sesiones en Postgres |
| @prisma/client / @prisma/adapter-pg | 7.8.0 | acceso a datos |
| pg | 8.22.0 | driver Postgres |
| bcryptjs | 3.0.3 | hash de contrasenas |
| @google/generative-ai | 0.24.1 | tutor con Gemini |
| zod | 4.4.3 | validacion de entradas |
| gray-matter | 4.0.3 | frontmatter del contenido |
| react-markdown / remark-gfm | 10.1.0 / 4.0.1 | render de lecciones |
| lucide-react | 1.24.0 | iconos SVG |
| class-variance-authority / clsx / tailwind-merge | 0.7.1 / 2.1.1 / 3.6.0 | utilidades de estilo |
| three | 0.186.1 | visor 3D de Bundles FHIR en el laboratorio |

## Desarrollo

| paquete | version | para que |
|---|---|---|
| typescript | 5.9.3 | tipado |
| tailwindcss / @tailwindcss/postcss | 4.3.2 | estilos |
| eslint / eslint-config-next | 9.39.5 / 16.2.10 | lint |
| prisma | 7.8.0 | migraciones y cliente |
| tsx | 4.23.1 | scripts TypeScript y pruebas con `node --test` |
| dotenv | 17.4.2 | variables de entorno en scripts |
| @types/three | 0.186.0 | tipos de three |
| @types/node, @types/react, @types/react-dom, @types/pg, @types/bcryptjs | ver lockfile | tipos |

## Decisiones

- **three 0.186.1 (2026-10-07).** Dibuja el grafo de recursos y referencias de un Bundle.
  Se descarto `react-force-graph-3d` 1.29.2: suma cinco librerias transitivas (kapsule,
  three-forcegraph, three-render-objects, d3-force-3d y otras) para un grafo que rara vez
  pasa de 50 nodos; el layout de fuerzas propio cabe en un modulo pequeno. `three` no tiene
  dependencias transitivas. `npm audit` sin avisos para three ni @types/three.

## Avisos de seguridad abiertos

Medido con `npm audit` el 2026-10-07: 28 vulnerabilidades previas a este documento, con
criticas en `next` (<=16.3.5) y `@auth/core` (via next-auth). Pendiente de una tarea propia
de actualizacion; ninguna proviene de three.
