# Tablero de progreso

Apunta el porcentaje del quiz de cada módulo y tus dudas. Es tu evidencia
objetiva de avance. Criterio de maestría: quiz ≥ 80 %. La ruta completa está en
`RUTA.md`; este archivo es solo el registro.

Comandos:

- Quiz de un módulo:   python evaluacion\quiz_runner.py --dia N
- Quiz módulo extra:   python evaluacion\quiz_runner.py --extra historia-fhir
- Simulacro intercalado: python evaluacion\quiz_runner.py --repaso --n 25
- Repaso espaciado:   python evaluacion\repaso.py
- Preparación (3 certs): python evaluacion\preparacion.py

## Etapa 1 — Cimientos

- [ ] Tema 0 · Por qué existe FHIR (opcional)   quiz extra: ___%
  - Lección: OK (2026-06-21). Notas: `notas/extra-historia-fhir.md`
  - **Pendiente:** quiz oficial (≥ 80 %) y Reto Feynman
- [ ] Tema 1 · JSON y XML             día 1: ___% día 2: ___%
- [ ] Tema 2 · HTTP y REST             día 3: ___% día 4: ___% día 5: ___% día 7: ___%
- [ ] Tema 3 · Seguridad (OAuth/SMART concepto)  día 6: ___%
- [ ] Simulacro de cierre (--repaso --n 15):  ___%

## Etapa 2 — El estándar FHIR

- [ ] Tema 4 · Modelo FHIR (recursos, Bundle)   día 12: ___%
- [ ] Tema 5 · Búsqueda avanzada          día 18: ___%
- [ ] Tema 6 · Terminologías            día 11: ___% día 19: ___%
- [ ] Tema 7 · Validación y Profiles        día 15: ___% día 16: ___%
- [ ] Simulacro de cierre (--repaso --n 25):  ___%

## Etapa 3 — Práctica real

- [ ] Tema 8 · FHIR en Google Cloud        día 8: ___% día 9: ___% día 10: ___% día 20: ___%
- [ ] Tema 9 · SMART on FHIR en práctica      día 17: ___%
- [ ] Tema 10 · Proyecto integrador y examen    día 13: ___% día 14: ___%

## Retos Feynman (explica con tus palabras, 3-4 líneas por tema)

- Tema 0:
- Tema 1:
- Tema 2:
- Tema 3:
- Tema 4:
- Tema 5:
- Tema 6:
- Tema 7:
- Tema 8:
- Tema 9:
- Tema 10:

## Seguimiento de preparación (corre preparacion.py 1 vez por semana)

Anota el puntaje compuesto (0-100) de cada meta para ver tu tendencia.

| Fecha | Foundational | GCP | Advanced |
| ----- | ------------ | --- | -------- |
|    |       |   |     |

Recuerda: agenda un examen SOLO cuando su semáforo esté VERDE.

## Dudas para reforzar

(Anota lo que quede flojo, con la fecha)

- 2026-07-05 — resourceType: identifica el *tipo* de recurso (Patient, Observation…), no es sinónimo de "recurso".
- 2026-07-05 — FHIR usa camelCase en campos (`birthDate`, no `birthdate`).
- 2026-07-05 — Rutas JSON: índices empiezan en 0; cuidado con `[ ]` vs `{ }` al escribir rutas.

## Bitácora rápida

(Una línea por sesión: qué hice y qué aprendí)

- 2026-06-21 — Tema 0 (Historia FHIR): completé lección de contexto v2/v3→FHIR→R4; notas y export NotebookLM preparados.
- 2026-07-05 — Checkpoint sesión: auditoría Tema 0 (quiz/Feynman pendientes); handoff a Tema 1 en SESION.md.
- 2026-07-05 Tema 1 / día 1 (parcial): ejercicio_1 OK (birthDate, gender desde JSON local); pendiente GET HAPI y quiz.
- 2026-07-05 Reestructura: el lab ahora se navega por temas (RUTA.md) + app en docs/ + packs móviles en movil/.
