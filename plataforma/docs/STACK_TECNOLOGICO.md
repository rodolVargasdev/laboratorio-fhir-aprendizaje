# Stack tecnologico de la plataforma

Versiones resueltas en `package-lock.json`. Toda dependencia nueva se agrega aqui en el
mismo commit que la incorpora, con su motivo y la alternativa descartada.

## Ejecucion

| paquete | version | para que |
|---|---|---|
| next | 16.3.6 | framework (App Router, standalone) |
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

## Desarrollo

| paquete | version | para que |
|---|---|---|
| typescript | 5.9.3 | tipado |
| tailwindcss / @tailwindcss/postcss | 4.3.2 | estilos |
| eslint / eslint-config-next | 9.39.5 / 16.3.6 | lint |
| prisma | 7.8.0 | migraciones y cliente |
| tsx | 4.23.1 | scripts TypeScript y pruebas con `node --test` |
| dotenv | 17.4.2 | variables de entorno en scripts |
| @types/node, @types/react, @types/react-dom, @types/pg, @types/bcryptjs | ver lockfile | tipos |

## Decisiones

- **next 16.2.10 -> 16.3.6 (2026-10-07).** Version parcheada mas baja para los avisos de
  next. El de parche mas alto es GHSA-vcvr-r3jv-pc5j (critico, RCE en `next/og`
  ImageResponse), corregido en 16.3.6; los demas se corrigen en 16.2.11 o 16.3.3. 16.3.6
  fija postcss 8.5.23 y sharp ^0.35.4 (resuelve 0.35.5), igual que 16.4.0, por eso no hace
  falta 16.4.0. Las novedades de 16.3 son aditivas; ninguna toca `next.config.ts`.
  `eslint-config-next` acompana a la misma version.

## Avisos de seguridad abiertos

Medido con `npm audit` el 2026-10-07 antes de esta actualizacion: 28 vulnerabilidades
(4 criticas, 17 altas, 7 moderadas). En curso en la rama `fix/plataforma-vulnerabilidades`.
