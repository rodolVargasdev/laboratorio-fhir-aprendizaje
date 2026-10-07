# Vulnerabilidades de dependencias en plataforma

Rama: `fix/plataforma-vulnerabilidades` (desde `master` 94ad6e1).

## Objetivo

Dejar `npm audit` de `plataforma` sin avisos con parche disponible, subiendo cada paquete a
la version parcheada mas baja, sin degradar prisma a 6.x. Lo que no tenga parche queda
anotado en `plataforma/docs/STACK_TECNOLOGICO.md` con su GHSA, impacto real y fecha.

## Linea base (medida 2026-10-07)

`npm audit`: 28 vulnerabilidades (4 criticas, 17 altas, 7 moderadas).

## Decisiones

- **next 16.3.6, no 16.4.0.** El aviso de next con el parche mas alto es GHSA-vcvr-r3jv-pc5j
  (RCE en `next/og`), corregido en 16.3.6. 16.3.6 y 16.4.0 fijan el mismo postcss 8.5.23 y
  sharp ^0.35.4. `npm audit` sugiere 16.4.0 solo porque propone la ultima.
- **prisma 7.10.0 + overrides.** prisma fija versiones exactas: 7.10.0 trae @prisma/dev
  0.24.17 (valibot 1.4.2, sin @hono/node-server), pero sigue con mysql2 3.15.3 y
  deepmerge-ts 7.1.5. Se fuerzan mysql2 3.23.1 y deepmerge-ts 8.0.0 con `overrides`.
  @prisma/config solo llama `deepmerge` sobre objetos de configuracion (sin Map), asi que
  el cambio de comportamiento de v8 (merge profundo de Map) no lo afecta.
- **Sin parche:** braces (GHSA-vfj7-8cjw-p6xm, <=3.0.3, sin version corregida) via
  eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch. Solo lint.

## Tareas

- [x] T1 next y eslint-config-next 16.3.6 (inline, 2 archivos mecanicos) - f35a693
- [x] T2 next-auth 5.0.0-beta.32 y @auth/prisma-adapter 2.11.3 (inline) - 4e77591
- [x] T3 prisma 7.10.0, overrides de mysql2/deepmerge-ts, retiro de gray-matter (sin uso) y
  `npm audit fix` de transitivas (inline) - 6f84db1
- [x] T4 verificacion: build, lint, arranque con login y laboratorio, imagen Docker
  (revision RDD aprobada sobre launch.json y este documento - a022db6)

Cada tarea actualiza `plataforma/docs/STACK_TECNOLOGICO.md` en su mismo commit.

## Verificacion

`npm audit`, `npm run build`, `npm run lint`, `node --test` si hay pruebas, `next start` con
login y laboratorio.

## Evidencia

Medido el 2026-10-07. TDD: no configurado en el proyecto; `master` no tiene pruebas.

- `npm audit`: 28 (4 criticas, 17 altas, 7 moderadas) -> 5 altas, todas la cadena de
  braces (GHSA-vfj7-8cjw-p6xm, sin parche, solo lint).
- `npm run build` limpio (sin `.next`): verde con Next.js 16.3.6.
- `npm run lint`: 4 errores y 1 aviso, identicos a la linea base de `master` (previos,
  `react-hooks/static-components` y una variable sin uso en `lib/sr.ts`).
- `prisma generate` y `prisma validate` con 7.10.0 y deepmerge-ts 8.0.0: correctos.
- Salida standalone: no incluye prisma, mysql2, deepmerge-ts, braces ni hono.
- `next start` con Postgres local del compose: `/`, `/laboratorio` y `/panel` redirigen a
  `/login` sin sesion; `/api/auth/session` con Bearer malformado devuelve `null` (200).
- `next dev`: login de desarrollo lleva a `/panel`; `/laboratorio` con sesion ejecuta
  `GET metadata` contra hapi.fhir.org y devuelve 200. Sin errores en el servidor.
- Imagen Docker construida desde un clon limpio de la rama (310 MB) y arrancada con
  `node server.js` contra el Postgres local: `/login` 200, `/laboratorio` y `/panel` 307
  sin sesion, `/api/auth/session` `null`. Con `AUTH_URL` fijada (como en `deploy.yml`) las
  URLs de los proveedores salen correctas; sin ella usan `0.0.0.0:8080`.
- Sugerencias no bloqueantes de la revision: `plataforma-start` exige `npm run build`
  previo; la evidencia de humo es manual (no hay prueba automatizada de redireccion y
  sesion).
- Pendiente fuera de esta tarea: `prisma format --check` marca solo alineacion de espacios
  en `schema.prisma` (escrito a mano, previo).
- Conflicto previsto con `visor-bundle-3d` (crea el mismo `STACK_TECNOLOGICO.md` y toca
  `package.json`): se resuelve en esta rama al sincronizar con `master`.
