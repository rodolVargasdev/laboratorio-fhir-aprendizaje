# Dia 14: Cierre, autoevaluacion final y plan de continuacion

Objetivo: medir objetivamente lo aprendido en las 2 semanas, limpiar recursos de
la nube (si los usaste) y definir tu camino del resto del anio hacia la
certificacion.
Tiempo: 2-3 horas. Costo objetivo: $0.

## Rutina de cierre

1. Repaso espaciado y estado:

   ```powershell
   python evaluacion\repaso.py
   python evaluacion\repaso.py --estado
   ```

2. Examen final acumulado (mezcla de todo):

   ```powershell
   python evaluacion\quiz_runner.py --repaso --n 20
   python evaluacion\quiz_runner.py --dia 14
   ```

3. Revisa tu historial de resultados:

   ```powershell
   python -c "print(open('evaluacion/resultados/historial.csv', encoding='utf-8').read())"
   ```

4. Limpieza de la nube (si usaste GCP): sigue `practica/limpieza-gcp.md`.

## Criterio objetivo de exito de las 2 semanas

- Examen final (dia 14) >= 80%.
- La mayoria de tus tarjetas de Leitner en cajas 3-5.
- Los 7 puntos del checklist del dia 7 + estos: terminologias, modelo FHIR,
  Bundle, y un mini-proyecto funcionando.

Si cumples esto, tienes los CIMIENTOS listos. El estandar FHIR a profundidad y el
examen oficial son la siguiente etapa (ver `PLAN-RESTO-DEL-ANIO.md`).

## Que sigue

Abre `PLAN-RESTO-DEL-ANIO.md`: es tu hoja de ruta de varios meses para acumular
la experiencia practica que HL7 recomienda antes del examen Foundational
Implementer, con micro-aprendizaje para los dias ocupados (`MICRO-APRENDIZAJE.md`).

## Reto Feynman final

En `PROGRESO.md`, escribe una "clase" de 10 lineas que le darias a un companero
nuevo de DoctorSV para explicarle que es FHIR, como se consulta y por que importa.
Si puedes explicarlo claro, lo dominas.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi evaluador del Dia 14. Tema: cierre de mis 2 semanas de cimientos
para FHIR. Soy desarrollador intermedio en DoctorSV, en espanol. Tomame un repaso
final exigente e intercalado (mezclando todos los temas del dia 1 al 13), sin
darme las respuestas de inmediato. Identifica mis 3 puntos mas debiles y dame un
plan concreto para reforzarlos en las proximas semanas. Termina pidiendome que te
de una mini-clase de 10 lineas sobre que es FHIR (Feynman) y critica mi claridad.
