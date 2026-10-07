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

- [ ] T1 next y eslint-config-next 16.3.6 (inline, 2 archivos mecanicos)
- [ ] T2 next-auth 5.0.0-beta.32 y @auth/prisma-adapter 2.11.3 (inline)
- [ ] T3 prisma 7.10.0, overrides de mysql2/deepmerge-ts y `npm audit fix` de transitivas (inline)
- [ ] T4 verificacion: build, lint, arranque con login y laboratorio, imagen Docker

Cada tarea actualiza `plataforma/docs/STACK_TECNOLOGICO.md` en su mismo commit.

## Verificacion

`npm audit`, `npm run build`, `npm run lint`, `node --test` si hay pruebas, `next start` con
login y laboratorio.

## Evidencia

(se completa por tarea)
