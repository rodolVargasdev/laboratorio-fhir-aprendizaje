# Laboratorio FHIR — de cero a experto, en línea recta

Laboratorio autodirigido para dominar **HL7 FHIR** (rumbo a la certificación
Foundational Implementer y más allá). Metodología con evidencia científica:
recuperación activa, repetición espaciada e intercalado, con medición objetiva.
**Costo total: $0.**

> **Resumen en una frase:** lees en el celular, practicas en Python con un tutor
> de IA, te evalúas con quizzes automáticos y repasas con tarjetas inteligentes.
> Cada persona clona su copia, avanza a su ritmo y el sistema te dice con números
> — no con sensaciones — cuándo estás listo para el examen oficial.

---

## Empieza aquí

1. **Prepara el entorno** (una vez, ~30 min): [00-setup/README.md](00-setup/README.md)
2. **Abre la ruta** y sigue los temas en orden: [RUTA.md](RUTA.md)
3. **Registra tu avance** en [PROGRESO.md](PROGRESO.md) y el estado de sesión en [SESION.md](SESION.md)

No necesitas decidir qué estudiar. `RUTA.md` es la línea recta: 3 etapas, 11 temas,
de arriba hacia abajo.

---

## Cómo se estudia cada tema (siempre igual)

| Paso | Dónde | Qué haces |
|------|-------|-----------|
| 1. Lectura | Celular (app o `movil/tema-XX.md`) | Lee el resumen del tema; opcionalmente súbelo a NotebookLM (audio + FAQ) |
| 2. Práctica | PC (terminal + Cursor Composer) | Ejecuta los ejercicios de los módulos `dias/` con el tutor IA |
| 3. Quiz | App (celular) o terminal | Quiz del tema; meta ≥ 80 % |
| 4. Retención | Celular o PC | Tarjetas Leitner, 5-10 min al día |

### Rutina de una sesión

1. Activar el entorno virtual (`.venv`)
2. Repaso Leitner (5-10 min): `python evaluacion\repaso.py`
3. Abrir el README del módulo (ej. `dias/dia-01/README.md`)
4. Copiar el bloque **"Prompt para Composer"** y pegarlo en el chat de Cursor
5. Seguir la conversación con el tutor (te pregunta antes de darte la respuesta)
6. Ejecutar los ejercicios Python en terminal
7. Escribir el Reto Feynman en `PROGRESO.md`
8. Hacer el quiz: `python evaluacion\quiz_runner.py --dia N`
9. Anotar el porcentaje en `PROGRESO.md`
10. Actualizar `SESION.md` al cerrar la sesión

**Regla de oro:** si el quiz sale < 80 %, repasa lo fallado y reintenta. No avances
sin dominar el tema.

Guía detallada del tutor IA: [guias/COMO-USAR-CON-COMPOSER.md](guias/COMO-USAR-CON-COMPOSER.md)

---

## La metodología (por qué funciona)

No medimos "cuánto leíste". Medimos **cuánto puedes recuperar y aplicar**.

| Técnica | Qué es | Cómo la usamos |
|---------|--------|----------------|
| **Recuperación activa** | Ponerte a prueba sin mirar el material | Quiz auto-corregido al final de cada módulo |
| **Repetición espaciada** | Repasar en intervalos crecientes | Sistema de cajas Leitner (`repaso.py`) |
| **Intercalado** | Mezclar temas en el repaso | Simulacros con `--repaso` |
| **Feynman** | Explicar con tus palabras | Retos escritos en `PROGRESO.md` |

### Cómo se mide el dominio

- **Quiz ≥ 80 %** = maestría de ese módulo (reintentos permitidos)
- **Tarjetas en cajas 4-5** = retención a largo plazo
- **`preparacion.py`** = semáforo rojo/amarillo/verde por certificación; agenda el
  examen solo en **VERDE**

Interpretación del quiz:

- ≥ 90 %: dominio sólido. Avanza.
- 80-89 %: dominio suficiente. Avanza, pero marca lo fallado para repaso.
- 60-79 %: repasa hoy y reintenta mañana.
- < 60 %: rehaz la lección y la práctica antes de reintentar.

Detalle completo: [guias/METODOLOGIA-APRENDIZAJE.md](guias/METODOLOGIA-APRENDIZAJE.md)

---

## Requisitos técnicos

### Obligatorios (por persona)

| Herramienta | Para qué | Dónde obtenerlo |
|-------------|----------|-----------------|
| **Python 3.11+** | Ejercicios, quizzes, scripts | [python.org/downloads](https://www.python.org/downloads/) — marcar "Add to PATH" |
| **Git** | Clonar y actualizar el repositorio | [git-scm.com](https://git-scm.com/) |
| **Cursor** (o VS Code) | Editor + tutor IA Composer | [cursor.com](https://cursor.com/) |
| **Cuenta GitHub** | Clonar el repo y publicar la app en celular | [github.com](https://github.com/) |
| **Terminal** | PowerShell (Windows) o bash (Mac/Linux) | Ya viene en el sistema |

### Recomendados (no obligatorios)

| Herramienta | Para qué |
|-------------|----------|
| **Bruno / Postman / Insomnia** | Ver peticiones HTTP a servidores FHIR de forma gráfica |
| **NotebookLM** | Convertir lecturas en audio y FAQ para el celular |
| **Cuenta Google Cloud** | Solo desde el Tema 8; capa gratuita + guía de limpieza |

### Setup inicial (una vez)

```powershell
git clone https://github.com/rodolVargasdev/laboratorio-fhir-aprendizaje.git
cd laboratorio-fhir-aprendizaje
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Windows
pip install -r requirements.txt
python 00-setup\verificar_entorno.py  # debe decir "Entorno listo"
```

En Mac/Linux: `source .venv/bin/activate` en lugar del paso de activación.

---

## Varios estudiantes en simultáneo

El diseño contempla **múltiples personas** estudiando en paralelo. El repositorio
es el **currículo compartido**; el progreso es **personal y local**.

```
Repositorio maestro (GitHub)
    ├── Persona A → clona en su PC → su PROGRESO.md, su .venv, sus resultados
    ├── Persona B → clona en su PC → su PROGRESO.md, su .venv, sus resultados
    └── Persona C → clona en su PC → su PROGRESO.md, su .venv, sus resultados
```

### Qué es compartido vs. qué es personal

| Compartido (repo GitHub) | Personal (cada estudiante, NO se sube a git) |
|--------------------------|-----------------------------------------------|
| Lecciones, ejercicios, quizzes | `PROGRESO.md` (bitácora y porcentajes) |
| App web (`docs/`) | `SESION.md` (estado de la sesión con el tutor) |
| Packs de lectura (`movil/`) | `evaluacion/resultados/` (historial de quizzes y Leitner) |
| Scripts de evaluación | `.venv/` (entorno virtual Python) |
| | Progreso de la app en celular (localStorage del navegador) |
| | Carpeta `institucion/` (entregables de prácticas nacionales) |
| | Credenciales GCP (si las usa) |

El `.gitignore` excluye automáticamente resultados personales, credenciales y el
entorno virtual. Cada quien avanza a su ritmo sin afectar al grupo.

### Tutor IA, app y ritmo

- **Cursor Composer:** cada persona abre su workspace local. El tutor lee `SESION.md`,
  `RUTA.md` y `PROGRESO.md` y continúa desde donde quedó. Al cerrar sesión, actualiza
  esos archivos.
- **App del celular:** se publica una vez con GitHub Pages ([docs/README.md](docs/README.md)).
  Todos acceden a la misma URL, pero el progreso vive en el dispositivo de cada uno.
- **Ritmo independiente:** no hay clase grupal ni fecha límite. Los simulacros semanales
  y `preparacion.py` son indicadores individuales.

---

## La app (estudiar desde el celular, gratis)

`docs/index.html` es una app estática con la ruta, lecturas, quizzes interactivos
y tarjetas Leitner. Publícala gratis con GitHub Pages siguiendo
[docs/README.md](docs/README.md) y agrégala a la pantalla de inicio del teléfono.

URL de producción:
`https://rodolvargasdev.github.io/laboratorio-fhir-aprendizaje/`

---

## Estructura del repositorio

| Qué | Dónde |
|-----|-------|
| **La ruta (empieza aquí)** | [RUTA.md](RUTA.md) |
| Preparar el entorno (una vez) | [00-setup/README.md](00-setup/README.md) |
| Lecturas de celular + NotebookLM | `movil/tema-XX.md` |
| Práctica de cada módulo | `dias/dia-01` … `dias/dia-20`, `dias/extra-historia-fhir` |
| App (celular/PC) | `docs/` |
| Motor de evaluación (quiz, Leitner, preparación) | `evaluacion/` |
| Mapa temas ↔ módulos | `evaluacion/temas.json` |
| Tu tablero de avance | [PROGRESO.md](PROGRESO.md) |
| Estado de la sesión con el tutor | [SESION.md](SESION.md) |
| Guías de método y planes largos | `guias/` |
| Prácticas institucionales (integración nacional) | [PRACTICAS-NACIONALES.md](PRACTICAS-NACIONALES.md) |
| Enlaces oficiales | [recursos/enlaces-oficiales.md](recursos/enlaces-oficiales.md) |

---

## Comandos esenciales (PC)

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje
.\.venv\Scripts\Activate.ps1

python evaluacion\quiz_runner.py --dia N        # quiz oficial de un módulo
python evaluacion\repaso.py                     # repaso espaciado (Leitner)
python evaluacion\quiz_runner.py --repaso --n 25  # simulacro semanal
python evaluacion\preparacion.py                # semáforo de examen
python evaluacion\export_notebooklm.py --dia N  # export para NotebookLM
python docs\generar_datos.py                    # regenerar datos de la app
```

---

## Seguridad y costo

- **Solo datos ficticios.** Nunca datos reales de pacientes.
- **GCP:** capa gratuita con guía de limpieza al terminar cada sesión
  (`dias/dia-14/practica/limpieza-gcp.md`).
- **Credenciales:** el `.gitignore` impide subir claves por accidente.
- **Servidores públicos:** HAPI FHIR (`hapi.fhir.org`) para práctica sin instalar nada.

---

## Días sin tiempo

5-15 minutos bastan: tarjetas en la app desde el celular, o
`python evaluacion\repaso.py --max 8`. Detalle:
[guias/MICRO-APRENDIZAJE.md](guias/MICRO-APRENDIZAJE.md).
