# Sesión activa — laboratorio FHIR

Última actualización: 2026-07-05

## Dónde estamos

- **Tema 0 (Historia FHIR)**: lección OK; pendiente quiz (`--extra historia-fhir`) y Feynman.
- **Tema 1 (JSON y XML) en curso** — módulo `dias/dia-01`:
  - [x] Diagnóstico (JSON, REST, Patient)
  - [x] Teoría / rutas JSON
  - [x] Práctica local (`ejercicio_1_local.py` + RETO)
  - [ ] Primer GET servidor (`ejercicio_2_servidor.py`)
  - [ ] Autoevaluación + Feynman
  - [ ] Quiz oficial (`--dia 1`)
  - Después: módulo `dias/dia-02` (JSON anidado + XML) y cierras el Tema 1.

## Novedad de estructura (2026-07-05)

El laboratorio se navega ahora por TEMAS, no por días: la línea recta está en
`RUTA.md`. Lecturas de celular en `movil/`, app en `docs/` (publicable gratis en
GitHub Pages), guías largas en `guias/`. Los módulos `dias/` siguen siendo la
práctica de PC y `quiz_runner.py --dia N` no cambió.

## Notas de tutor (última sesión)

- JSON y arrays: sólido.
- Rutas tipo `Patient.name[0].family`: correcto.
- GET + Postman: experiencia previa útil.
- Reforzar: `resourceType` identifica el tipo (no solo Patient); camelCase FHIR (`birthDate`).

## Prompt de continuación (copiar en chat nuevo)

```
Continúo laboratorio FHIR. Lee SESION.md, RUTA.md y PROGRESO.md.
Tema 1 (día 1) en curso — sección: [indica cuál].
Reglas: español, recuperación activa, actualiza PROGRESO.md y SESION.md al cerrar sección.
```
