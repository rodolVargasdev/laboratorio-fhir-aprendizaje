# Laboratorio FHIR — de cero a experto, en línea recta

Laboratorio personal para dominar HL7 FHIR (rumbo a la certificación Foundational
Implementer y más allá), como desarrollador de la integración nacional de salud en El Salvador.
Metodología con evidencia: recuperación activa + repetición espaciada + intercalado,
con medición objetiva. Costo total: $0.

## Empieza aquí (y no necesitas nada más)

**Abre [RUTA.md](RUTA.md).** Es la línea recta: 3 etapas, 11 temas, siempre
sabes cuál es el siguiente paso. Cada tema se estudia igual:

1. **Celular** — lee el pack del tema en `movil/` (o en la app) y súbelo a NotebookLM.
2. **PC** — haz la práctica de los módulos `dias/` con Composer como tutor.
3. **Quiz** — meta ≥ 80 % (app o `quiz_runner.py`).
4. **Retención** — tarjetas Leitner 5-10 min al día (app o `repaso.py`).

## La app (estudiar desde el celular, gratis)

`docs/index.html` es una app estática con la ruta, las lecturas, quizzes
interactivos y tarjetas Leitner. Publícala gratis con GitHub Pages siguiendo
[docs/README.md](docs/README.md) y agrégala a la pantalla de inicio del teléfono.

## Estructura del workspace

| Qué | Dónde |
|-----|-------|
| **La ruta (empieza aquí)** | [RUTA.md](RUTA.md) |
| Lecturas de celular + NotebookLM | `movil/tema-XX.md` |
| Práctica de cada módulo | `dias/dia-01` … `dias/dia-20`, `dias/extra-historia-fhir` |
| App (celular/PC) | `docs/` |
| Motor de evaluación (quiz, Leitner, preparación) | `evaluacion/` |
| Mapa temas ↔ módulos | `evaluacion/temas.json` |
| Tu tablero de avance | [PROGRESO.md](PROGRESO.md) |
| Estado de la sesión con el tutor | [SESION.md](SESION.md) |
| Guías de método y planes largos | `guias/` |
| Enlaces oficiales | `recursos/enlaces-oficiales.md` |
| Preparar el entorno (una vez) | `00-setup/README.md` |

## Comandos esenciales (PC)

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje
.\.venv\Scripts\Activate.ps1

python evaluacion\quiz_runner.py --dia N   # quiz oficial de un módulo
python evaluacion\repaso.py         # repaso espaciado (Leitner)
python evaluacion\quiz_runner.py --repaso --n 25  # simulacro semanal
python evaluacion\preparacion.py       # ¿listo para agendar examen? (semáforo)
python evaluacion\export_notebooklm.py --dia N   # export extra para NotebookLM
python docs\generar_datos.py         # regenerar datos de la app
```

## Cómo se mide que SÍ aprendiste

- Quiz por tema con umbral de maestría (80 %) y desglose Bloom.
- Tarjetas Leitner migrando a cajas 4-5 = retención real.
- `preparacion.py`: puntaje compuesto 0-100 y semáforo por certificación;
 agenda el examen solo en VERDE. Detalle: `guias/METODOLOGIA-APRENDIZAJE.md`.

## Seguridad y costo

Todo es local y gratuito (servidores públicos de prueba, HAPI local o capa
gratuita de Cloud Healthcare API, con guía de limpieza). Usa SIEMPRE datos
ficticios; nunca datos reales de pacientes. El `.gitignore` excluye claves y secretos.

## Clonar en otro dispositivo

```powershell
git clone https://github.com/rodolVargasdev/laboratorio-fhir-aprendizaje.git
cd laboratorio-fhir-aprendizaje
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python 00-setup\verificar_entorno.py
```

En Linux/macOS: `source .venv/bin/activate`. Luego continúa desde `RUTA.md`.
