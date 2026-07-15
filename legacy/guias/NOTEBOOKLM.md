# Estudiar cada dia con NotebookLM

NotebookLM es util **despues** de estudiar con Composer: repaso, audio, preguntas
orales y conexiones entre conceptos. No reemplaza la practica en terminal ni el
quiz auto-corregido (esos miden objetivamente; NotebookLM no).

## Flujo recomendado (un dia)

| Momento | Herramienta | Que haces |
|---------|-------------|-----------|
| Aprender | Composer 2.5 + README del dia | Tutoria guiado, practica, Feynman |
| Medir | `quiz_runner.py --dia N` | Umbral 80 %, historial en CSV |
| Consolidar | NotebookLM | Repaso, audio, preguntas, mapas mentales |
| Retener | `repaso.py` (Leitner) | 5-10 min al dia siguiente |

## Paso 1 — Generar el paquete del dia

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje
.\.venv\Scripts\Activate.ps1
python evaluacion\export_notebooklm.py --dia 17
```

Salida: `evaluacion/exports/dia-17-notebooklm.md`

Para una semana entera:

```powershell
python evaluacion\export_notebooklm.py --desde 1 --hasta 7
```

Con tus notas personales (opcional):

```powershell
python evaluacion\export_notebooklm.py --dia 17 --notas notas\dia-17.md
```

## Paso 2 — Subir a NotebookLM

1. Abre [notebooklm.google.com](https://notebooklm.google.com) (cuenta Google).
2. **Nuevo cuaderno** → nombre sugerido: `FHIR Dia 17 - SMART`.
3. **Anadir fuente** → sube el `.md` generado.
4. (Opcional) Anade 1-2 enlaces oficiales del dia (HL7 spec, GCP docs). No
   satures el cuaderno: 3-5 fuentes por dia suelen bastar.

### Formatos que acepta NotebookLM

- Markdown (`.md`) — el que genera el script
- PDF, Google Docs, texto pegado
- URLs publicas (documentacion HL7, Google Cloud)

### Que NO subir

- Credenciales, `.pem`, service accounts, tokens
- `evaluacion/resultados/historial.csv` (progreso personal)
- Repos privados enteros (usa el export, no el repo completo)

## Paso 3 — Estudiar con las funciones de NotebookLM

### Audio Overview (repaso en movimiento)

Boton **Audio Overview** → genera un podcast de ~10 min sobre tus fuentes.
Ideal despues de completar el dia, para fijar conceptos sin mirar pantalla.

### Chat con prompts utiles

El export incluye prompts listos al final del `.md`. Ejemplos rapidos:

- "Hazme un examen oral de 10 preguntas; corrige despues de cada respuesta."
- "Explica App Launch vs Backend Services como si fuera para un dev de la integración nacional."
- "Que errores comunes cometeria al implementar esto en GCP Healthcare API?"

### Study Guide / FAQ

Pide: "Genera una guia de estudio con definiciones, comparaciones y ejemplos
concretos basados solo en las fuentes." Util la noche antes del quiz de repaso.

## Estrategia por objetivo

### Repaso rapido (15 min)

1. Audio Overview del dia.
2. Repasa flashcards del export (seccion incluida).
3. `python evaluacion\repaso.py` — solo tarjetas del dia si las anadiste.

### Preparacion certificacion

1. Un cuaderno por **bloque tematico** (ej. "FHIR Seguridad" = dias 6, 9, 17).
2. Exporta el rango: `--desde 6 --hasta 17` y sube **un archivo por dia** (mejor
   que un mega-archivo: NotebookLM cita fuentes con precision).
3. Pregunta: "Simula 5 preguntas estilo HL7 Foundational sobre SMART scopes."

### Semana consolidada

Cuaderno `FHIR Semana 1` con exports dia-01 … dia-07. Pide un mapa mental de
como JSON, REST, CRUD y OAuth se conectan.

## Consejos que marcan diferencia

1. **Orden importa:** primero Composer + practica + quiz; NotebookLM es capa 2.
   Si solo lees en NotebookLM sin hacer ejercicios, el quiz local te lo mostrara.

2. **Un cuaderno por tema, no uno gigante:** mezclar 20 dias en un solo cuaderno
   diluye respuestas. Mejor 4-5 cuadernos tematicos.

3. **Verifica alucinaciones:** NotebookLM puede inventar detalles de FHIR. Cruza
   con `recursos/enlaces-oficiales.md` o pregunta "cita la seccion de la fuente."

4. **Quiz con respuestas en el export:** estan para **repaso**, no para hacer
   trampa en `quiz_runner.py`. Haz el quiz en terminal sin mirar respuestas.

5. **Anade tus notas:** despues del Reto Feynman, escribe 5 bullets en un
   `notas/dia-XX.md` y re-exporta con `--notas`. Eso personaliza el Audio Overview.

6. **Sincroniza con Leitner:** las flashcards del export coinciden con
   `evaluacion/flashcards.json`. Lo que falles en NotebookLM, marca en `repaso.py`.

## Carpeta de notas personales (opcional)

Crea `notas/` en la raiz del repo (esta en `.gitignore` si anades notas sensibles;
por ahora puedes versionar plantillas vacias):

```powershell
mkdir notas
echo "# Notas Dia 17" > notas\dia-17.md
```

Plantilla minima por dia:

```markdown
# Notas Dia 17

## Lo que entendi con mis palabras
-

## Dudas resueltas con Composer
-

## Errores que cometi en practica
-

## 3 cosas que quiero recordar manana
1.
2.
3.
```

## Comandos resumen

```powershell
# Exportar un dia
python evaluacion\export_notebooklm.py --dia 17

# Exportar modulo extra (historia FHIR)
python evaluacion\export_notebooklm.py --extra historia-fhir

# Exportar semana
python evaluacion\export_notebooklm.py --desde 1 --hasta 7

# Repaso Leitner (terminal)
python evaluacion\repaso.py

# Quiz oficial (sin mirar respuestas del export)
python evaluacion\quiz_runner.py --dia 17
```
