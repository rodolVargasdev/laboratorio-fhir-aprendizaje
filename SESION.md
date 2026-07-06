# Sesión activa — laboratorio FHIR

Archivo de continuidad entre conversaciones. **Actualizar al cerrar cada sesión**
o cada 2-3 secciones de estudio.

Última actualización: **2026-07-05**

## Estado actual

| Campo | Valor |
|-------|-------|
| **Tema activo** | Tema 1 · JSON y XML (módulo `dias/dia-01`) |
| **Último cerrado** | Tema 0 (lección; quiz y Feynman PENDIENTES) |
| **Idioma / tutor** | Español; recuperación activa; el tutor registra progreso en PROGRESO.md |
| **Umbral maestría** | Quiz ≥ 80 % |

## Tema 0 — pendientes de cierre (antes o en paralelo al Tema 1)

- Quiz oficial: `python evaluacion\quiz_runner.py --extra historia-fhir` (% a PROGRESO.md)
- Reto Feynman (8-10 frases) en PROGRESO.md
- Export NotebookLM: `python evaluacion\export_notebooklm.py --extra historia-fhir --notas notas\extra-historia-fhir.md`
  (o usa directamente `movil/tema-00-historia.md`, ya listo para NotebookLM)

## Tema 1 en curso — módulo `dias/dia-01`

- [x] Diagnóstico (JSON, REST, Patient)
- [x] Teoría / rutas JSON
- [x] Práctica local (`ejercicio_1_local.py` + RETO: birthDate y gender OK)
- [ ] Primer GET servidor (`ejercicio_2_servidor.py`, HAPI `hapi.fhir.org/baseR4`)
- [ ] Autoevaluación + Feynman
- [ ] Quiz oficial (`--dia 1`)
- Después: módulo `dias/dia-02` (JSON anidado + XML) y cierras el Tema 1.

## Novedad de estructura (2026-07-05)

El laboratorio se navega por TEMAS: la línea recta está en `RUTA.md`. Lecturas de
celular en `movil/`, app en `docs/` (GitHub Pages), guías largas en `guias/`,
prácticas institucionales la integración nacional en `PRACTICAS-NACIONALES.md`. Los módulos `dias/`
siguen siendo la práctica de PC y `quiz_runner.py --dia N` no cambió.

## Notas de tutor (última sesión)

- JSON y arrays: sólido. Rutas tipo `Patient.name[0].family`: correcto.
- GET + Postman: experiencia previa útil.
- Reforzar: `resourceType` identifica el tipo (no solo Patient); camelCase FHIR (`birthDate`).

## Preferencias del estudiante (mantener en cada sesión)

1. El tutor registra progreso en `PROGRESO.md`, preguntando al cerrar cada sección.
2. Checkpoint en `SESION.md` al final de sesión o cada 2-3 secciones.
3. NotebookLM: usar los packs `movil/tema-XX.md` (y `evaluacion/exports/` si se regenera local).

## Bitácora de sesiones

| Fecha | Sesión | Hecho | Siguiente |
|-------|--------|-------|-----------|
| 2026-06-21 | 1 | Setup, módulo historia, notas NotebookLM, push GitHub | Día 1 |
| 2026-07-05 | 2 | Auditoría Tema 0, checkpoint SESION.md, handoff Día 1 | Día 1 sección diagnóstico |
| 2026-07-05 | 3 | Día 1 parcial (ejercicio_1 + RETO OK); reestructura por temas, app docs/, packs movil/ | GET a HAPI + quiz día 1 |

## Prompt de continuación (copiar en chat nuevo)

```
Continúo laboratorio FHIR. Lee SESION.md, RUTA.md y PROGRESO.md.
Tema 1 (día 1) en curso — sección: [indica cuál].
Reglas: español, recuperación activa, actualiza PROGRESO.md y SESION.md al cerrar sección.
```
