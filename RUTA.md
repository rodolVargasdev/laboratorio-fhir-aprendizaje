# RUTA — tu línea recta hacia experto en FHIR

Este archivo es **el único que necesitas abrir para saber qué sigue**. Se lee de
arriba hacia abajo: termina un tema, marca su casilla y pasa al siguiente. Nada más.

> **¿Dónde voy?** → Tema 1 (JSON y XML), módulo `dias/dia-01`, sección "Primer GET al servidor".

---

## Cómo se estudia CADA tema (siempre igual, 4 pasos)

| Paso | Dónde | Qué haces |
|------|-------|-----------|
| 1. 📱 Lectura | Celular (app o `movil/tema-XX.md`) | Lee el resumen del tema y sube el pack a NotebookLM (audio + FAQ) |
| 2. 💻 Práctica | PC (terminal + Composer) | Ejecuta los ejercicios de los módulos `dias/` del tema |
| 3. 📱💻 Quiz | App (celular) o terminal | Quiz del tema, meta ≥ 80 % |
| 4. 📱 Retención | Celular (app) o terminal | Tarjetas Leitner 5-10 min al día |

Comandos de PC (una vez por sesión de terminal):

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje
.\.venv\Scripts\Activate.ps1
```

- Quiz de un módulo: `python evaluacion\quiz_runner.py --dia N`
- Repaso Leitner:    `python evaluacion\repaso.py`
- ¿Listo para agendar examen?: `python evaluacion\preparacion.py`

📱 **Desde el celular**: abre la app (ver `docs/README.md` para publicarla en
GitHub Pages, gratis). Ahí tienes lecturas, quizzes y tarjetas sin PC.

---

# ETAPA 1 — CIMIENTOS
*Meta: leer y hablar el idioma de FHIR: JSON, REST y seguridad básica.*

## ☐ Tema 0 · Por qué existe FHIR *(opcional, recomendado)*
- 📱 Lectura: [movil/tema-00-historia.md](movil/tema-00-historia.md)
- 💻 Práctica: [dias/extra-historia-fhir](dias/extra-historia-fhir/README.md)
- Quiz: `python evaluacion\quiz_runner.py --extra historia-fhir`

## ☐ Tema 1 · JSON y XML: el lenguaje de los datos  ← **ESTÁS AQUÍ**
- 📱 Lectura: [movil/tema-01-json-xml.md](movil/tema-01-json-xml.md)
- 💻 Práctica: [dias/dia-01](dias/dia-01/README.md) → [dias/dia-02](dias/dia-02/README.md)
- Quiz: `--dia 1` y `--dia 2`
- Pendiente hoy: `ejercicio_2_servidor.py`, Feynman y quiz del día 1.

## ☐ Tema 2 · HTTP y REST: hablar con un servidor FHIR
- 📱 Lectura: [movil/tema-02-http-rest.md](movil/tema-02-http-rest.md)
- 💻 Práctica: [dia-03](dias/dia-03/README.md) → [dia-04](dias/dia-04/README.md) → [dia-05](dias/dia-05/README.md) → cierre [dia-07](dias/dia-07/README.md)
- Quiz: `--dia 3`, `--dia 4`, `--dia 5`, `--dia 7`

## ☐ Tema 3 · Seguridad: OAuth 2.0 y SMART on FHIR (concepto)
- 📱 Lectura: [movil/tema-03-seguridad.md](movil/tema-03-seguridad.md)
- 💻 Práctica: [dia-06](dias/dia-06/README.md)
- Quiz: `--dia 6`

🏁 **Cierre de etapa**: simulacro corto `python evaluacion\quiz_runner.py --repaso --n 15`.

---

# ETAPA 2 — EL ESTÁNDAR FHIR
*Meta: el núcleo del examen Foundational — modelo de recursos, búsqueda, terminologías, validación.*

## ☐ Tema 4 · El modelo FHIR: recursos, referencias y Bundles
- 📱 Lectura: [movil/tema-04-modelo-fhir.md](movil/tema-04-modelo-fhir.md)
- 💻 Práctica: [dia-12](dias/dia-12/README.md)
- Quiz: `--dia 12`

## ☐ Tema 5 · Búsqueda avanzada
- 📱 Lectura: [movil/tema-05-busqueda.md](movil/tema-05-busqueda.md)
- 💻 Práctica: [dia-18](dias/dia-18/README.md)
- Quiz: `--dia 18`

## ☐ Tema 6 · Terminologías clínicas
- 📱 Lectura: [movil/tema-06-terminologias.md](movil/tema-06-terminologias.md)
- 💻 Práctica: [dia-11](dias/dia-11/README.md) → [dia-19](dias/dia-19/README.md)
- Quiz: `--dia 11`, `--dia 19`

## ☐ Tema 7 · Validación y Profiles
- 📱 Lectura: [movil/tema-07-validacion-profiles.md](movil/tema-07-validacion-profiles.md)
- 💻 Práctica: [dia-15](dias/dia-15/README.md) → [dia-16](dias/dia-16/README.md)
- Quiz: `--dia 15`, `--dia 16`

🏁 **Cierre de etapa**: simulacro `--repaso --n 25` cronometrado (45 min). Si ≥ 65 %,
ya estás en zona del examen Foundational: corre `preparacion.py --cert foundational --detalle`.

---

# ETAPA 3 — PRÁCTICA REAL
*Meta: implementar sobre Google Cloud y SMART; proyecto integrador estilo DoctorSV.*

## ☐ Tema 8 · FHIR en Google Cloud
- 📱 Lectura: [movil/tema-08-gcp.md](movil/tema-08-gcp.md)
- 💻 Práctica: [dia-08](dias/dia-08/README.md) → [dia-09](dias/dia-09/README.md) → [dia-10](dias/dia-10/README.md) → [dia-20](dias/dia-20/README.md)
- Quiz: `--dia 8`, `--dia 9`, `--dia 10`, `--dia 20`
- ⚠️ Al terminar cada sesión GCP: guía de limpieza (`dias/dia-14/practica/limpieza-gcp.md`) para mantener costo $0.

## ☐ Tema 9 · SMART on FHIR en práctica
- 📱 Lectura: [movil/tema-09-smart-practica.md](movil/tema-09-smart-practica.md)
- 💻 Práctica: [dia-17](dias/dia-17/README.md)
- Quiz: `--dia 17`

## ☐ Tema 10 · Proyecto integrador y examen
- 📱 Lectura: [movil/tema-10-proyecto.md](movil/tema-10-proyecto.md)
- 💻 Práctica: [dia-13](dias/dia-13/README.md) → [dia-14](dias/dia-14/README.md)
- Quiz: `--dia 13`, `--dia 14`

🏁 **Cierre del laboratorio**: 2 simulacros ≥ 65 % en días distintos + semáforo VERDE
en `preparacion.py` → agenda el examen **HL7 FHIR Foundational Implementer**.

---

## El norte: FHIR en tu institución (El Salvador)

Esta ruta no es solo para el examen. Al cerrarla completa quedas a nivel
**"amateur sólido" del estándar**: capaz de leer cualquier recurso R4, consultar y
crear datos por REST, entender terminologías, validar contra profiles y montar un
servidor FHIR en la nube. Con eso ya puedes empezar a **aplicarlo en DoctorSV**:

- Al estudiar cada tema, pregúntate: *¿cómo se vería esto en nuestra institución?*
  (ej. Tema 4: ¿qué recursos modelan una consulta en DoctorSV?; Tema 6: ¿qué
  terminologías usaríamos en español?; Tema 7: ¿qué profile salvadoreño haría falta?).
- Anota esas ideas en `PROGRESO.md` (sección de bitácora): serán la semilla del
  proyecto integrador del Tema 10 y de la propuesta institucional real.

## Después del laboratorio (ruta larga)

El detalle mes a mes hacia las 3 certificaciones (Foundational → competencia GCP →
Advanced Developer) está en [guias/PLAN-RESTO-DEL-ANIO.md](guias/PLAN-RESTO-DEL-ANIO.md).
La regla no cambia: **un tema a la vez, quiz ≥ 80 %, Leitner a diario, simulacro semanal.**

## Días sin tiempo

5-15 minutos bastan: tarjetas en la app desde el celular, o
`python evaluacion\repaso.py --max 8`. Detalle: [guias/MICRO-APRENDIZAJE.md](guias/MICRO-APRENDIZAJE.md).
