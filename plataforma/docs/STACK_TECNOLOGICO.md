# Stack tecnologico de la plataforma

Versiones resueltas en `package-lock.json`. Toda dependencia nueva se agrega aqui en el
mismo commit que la incorpora, con su motivo y la alternativa descartada.

## Ejecucion

| paquete | version | para que |
|---|---|---|
| next | 16.3.6 | framework (App Router, standalone) |
| react / react-dom | 19.2.4 | interfaz |
| next-auth | 5.0.0-beta.32 | autenticacion (Google y contrasena) |
| @auth/prisma-adapter | 2.11.3 | sesiones en Postgres |
| @prisma/client / @prisma/adapter-pg | 7.10.0 | acceso a datos |
| pg | 8.22.0 | driver Postgres |
| bcryptjs | 3.0.3 | hash de contrasenas |
| @google/generative-ai | 0.24.1 | tutor con Gemini |
| zod | 4.4.3 | validacion de entradas |
| react-markdown / remark-gfm | 10.1.0 / 4.0.1 | render de lecciones |
| lucide-react | 1.24.0 | iconos SVG |
| class-variance-authority / clsx / tailwind-merge | 0.7.1 / 2.1.1 / 3.6.0 | utilidades de estilo |
| three | 0.186.1 | visor 3D de Bundles FHIR en el laboratorio |

## Desarrollo

| paquete | version | para que |
|---|---|---|
| typescript | 5.9.3 | tipado |
| tailwindcss / @tailwindcss/postcss | 4.3.2 | estilos |
| eslint / eslint-config-next | 9.39.5 / 16.3.6 | lint |
| prisma | 7.10.0 | migraciones y cliente |
| tsx | 4.23.1 | scripts TypeScript y pruebas con `node --test` |
| dotenv | 17.4.2 | variables de entorno en scripts |
| @types/three | 0.186.0 | tipos de three |
| @types/node, @types/react, @types/react-dom, @types/pg, @types/bcryptjs | ver lockfile | tipos |

## Decisiones

- **next 16.2.10 -> 16.3.6 (2026-10-07).** Version parcheada mas baja para los avisos de
  next. El de parche mas alto es GHSA-vcvr-r3jv-pc5j (critico, RCE en `next/og`
  ImageResponse), corregido en 16.3.6; los demas se corrigen en 16.2.11 o 16.3.3. 16.3.6
  fija postcss 8.5.23 y sharp ^0.35.4 (resuelve 0.35.5), igual que 16.4.0, por eso no hace
  falta 16.4.0. Las novedades de 16.3 son aditivas; ninguna toca `next.config.ts`.
  `eslint-config-next` acompana a la misma version.

- **next-auth 5.0.0-beta.31 -> beta.32 y @auth/prisma-adapter 2.11.2 -> 2.11.3
  (2026-10-07).** Ambas traen @auth/core 0.41.3, que corrige GHSA-7rqj-j65f-68wh (critico,
  bypass del normalizador de correo con homoglifos), GHSA-xmf8-cvqr-rfgj (`getToken()`
  lanza excepcion con un Bearer malformado) y GHSA-x445-f3h2-j279 (cookies de state, nonce
  y PKCE no ligadas al proveedor). beta.32 ademas corrige GHSA-8fpg-xm3f-6cx3 (critico: con
  la configuracion rota, `auth()` devolvia un objeto de error verdadero y las comprobaciones
  por existencia fallaban abiertas). Sin cambios de API para el codigo del proyecto.

- **prisma, @prisma/client y @prisma/adapter-pg 7.8.0 -> 7.10.0 (2026-10-07).** Ultima 7.x
  estable; no se degrada a 6.x. 7.10.0 trae @prisma/dev 0.24.17, que ya no depende de
  @hono/node-server y fija valibot 1.4.2: cierra GHSA-92pp-h63x-v22m, GHSA-frvp-7c67-39w9
  y GHSA-5qjj-4xww-7phc, y con ellos los avisos de hono.

- **`overrides` sobre transitivas que prisma fija exactas (2026-10-07).** prisma 7.10.0
  sigue fijando mysql2 3.15.3 y @prisma/config fija deepmerge-ts 7.1.5, sin version de
  prisma que las suba. Se fuerzan, acotadas a quien las pide:
  - `prisma > mysql2` 3.23.1 (parche mas bajo para GHSA-3f6p-5ww8-9rcr y
    GHSA-rgwj-5xj2-c3m3). Mismo mayor 3.x. El proyecto usa Postgres; mysql2 solo lo carga
    el CLI para MySQL.
  - `@prisma/config > deepmerge-ts` 8.0.0 (parche de GHSA-ggr8-5vv4-36mx). Es mayor nuevo:
    su cambio de comportamiento es el merge profundo de `Map`, y @prisma/config solo llama
    `deepmerge` sobre objetos de configuracion planos. Comprobado: `prisma generate` y
    `prisma validate` cargan `prisma.config.ts` sin errores.
  Al subir prisma, revisar si ya trae versiones corregidas y retirar los overrides.

- **Se retira gray-matter 4.0.3 (2026-10-07).** Estaba declarada pero ningun archivo la
  importa en todo el historial. Arrastraba js-yaml 3.15.2 -> argparse 1.0.10 -> sprintf-js
  1.0.3, con GHSA-hp3w-g68c-fv3c sin parche publicado. Sin uso, se elimina.

- **`npm audit fix` sin `--force` (2026-10-07).** Subio dentro de sus rangos las
  transitivas con parche: sharp 0.35.5, postcss 8.5.23, fast-uri 3.1.8, nanoid 3.3.20,
  brace-expansion 1.1.21 y 5.0.12, browserslist 4.29.3, baseline-browser-mapping 2.11.27,
  source-map-js 1.2.2, js-yaml 4.3.2 (de eslint).

- **three 0.186.1 (2026-10-07).** Dibuja el grafo de recursos y referencias de un Bundle.
  Se descarto `react-force-graph-3d` 1.29.2: suma cinco librerias transitivas (kapsule,
  three-forcegraph, three-render-objects, d3-force-3d y otras) para un grafo que rara vez
  pasa de 50 nodos; el layout de fuerzas propio cabe en un modulo pequeno. `three` no tiene
  dependencias transitivas. `npm audit` sin avisos para three ni @types/three.

## Avisos de seguridad abiertos

Linea base medida con `npm audit` el 2026-10-07: 28 vulnerabilidades (4 criticas, 17
altas, 7 moderadas). Tras esta actualizacion, el mismo dia: 5 altas, todas de una sola
cadena sin parche.

| aviso | paquete | via | impacto real | revision |
|---|---|---|---|---|
| GHSA-vfj7-8cjw-p6xm (alta, DoS por patrones de llaves anidados) | braces <=3.0.3, sin version corregida | eslint-config-next 16.3.6 -> @next/eslint-plugin-next -> fast-glob 3.3.1 -> micromatch -> braces | Solo lint en desarrollo. Los patrones que expande vienen de la configuracion de eslint del repositorio, no de entrada de usuarios. No entra en la imagen de Cloud Run (salida standalone). `npm audit` propone eslint-config-next 14.2.35, que es degradar dos mayores: descartado. | 2026-10-07; revisar en cada version de eslint-config-next o cuando braces publique parche |
