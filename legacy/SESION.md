# Sesión activa — laboratorio FHIR

Archivo de continuidad entre conversaciones. **Actualizar al cerrar cada sesión**
o cada 2-3 secciones de estudio.

Última actualización: **2026-07-14**

## Estado actual

| Campo | Valor |
|-------|-------|
| **Tema activo** | Inicio — `00-setup` o Tema 0 (historia de FHIR) |
| **Último cerrado** | Ninguno (progreso reiniciado) |
| **Idioma / tutor** | Español; recuperación activa; el tutor registra progreso en PROGRESO.md |
| **Umbral maestría** | Quiz ≥ 80 % |

## Primeros pasos

1. Verificar entorno: `python 00-setup\verificar_entorno.py`
2. Abrir la ruta: [RUTA.md](RUTA.md)
3. Tema 0 (opcional, recomendado): leer `movil/tema-00-historia.md` y practicar en `dias/extra-historia-fhir/`
4. Tema 1: módulo `dias/dia-01` — diagnóstico, teoría, práctica local y GET al servidor

## Preferencias del estudiante (mantener en cada sesión)

1. El tutor registra progreso en `PROGRESO.md`, preguntando al cerrar cada sección.
2. Checkpoint en `SESION.md` al final de sesión o cada 2-3 secciones.
3. NotebookLM: usar los packs `movil/tema-XX.md` (y `evaluacion/exports/` si se regenera local).

## Bitácora de sesiones

| Fecha | Sesión | Hecho | Siguiente |
|-------|--------|-------|-----------|
| 2026-07-14 | — | Progreso reiniciado | Setup + Tema 0 o Tema 1 |

## Prompt de continuación (copiar en chat nuevo)

```
Continúo laboratorio FHIR. Lee SESION.md, RUTA.md y PROGRESO.md.
Empiezo desde el inicio (setup / Tema 0 o Tema 1).
Reglas: español, recuperación activa, actualiza PROGRESO.md y SESION.md al cerrar sección.
```
