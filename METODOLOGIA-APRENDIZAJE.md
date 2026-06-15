# Metodologia: como sabemos, de forma objetiva, que SI aprendiste

Este documento explica el metodo de aprendizaje y, sobre todo, como medimos de
forma objetiva (con numeros, no con sensaciones) si realmente dominaste cada dia.

## El problema que evitamos: la "ilusion de competencia"

Releer y subrayar se SIENTEN productivos, pero la investigacion muestra que
crean una falsa sensacion de dominio: reconoces el material, pero no lo puedes
recuperar de memoria cuando lo necesitas (por ejemplo, en el examen). Por eso
aqui no medimos "cuanto lei", medimos "cuanto puedo recuperar y aplicar".

## Las tres tecnicas con mas evidencia (y que usamos)

Basado en la revision de Dunlosky et al. (2013, Psychological Science in the
Public Interest) y en los estudios de Roediger y Karpicke:

1. Recuperacion activa (active recall / testing effect).
   Te pones a prueba sin mirar el material. El esfuerzo de recordar es lo que
   fija la memoria. Dato concreto: en el estudio clasico de Roediger y Karpicke
   (2006), quienes practicaron recuperacion retuvieron ~80% del material a la
   semana, frente a ~34% de quienes solo releyeron. Por eso cada dia termina con
   un quiz que se corrige solo.

2. Repeticion espaciada (spaced repetition / spacing effect).
   Repasar en intervalos crecientes vence la "curva del olvido" de Ebbinghaus.
   Lo implementamos con un sistema de cajas de Leitner (ver abajo), que decide
   automaticamente que tarjetas te toca repasar hoy.

3. Intercalado (interleaving).
   Mezclar temas en una misma sesion de repaso (en vez de bloques de un solo
   tema) mejora la retencion y la transferencia. El modo "repaso" del quiz
   mezcla preguntas de varios dias a proposito.

Tecnica de apoyo: Feynman. Si no puedes explicar algo en palabras simples, no lo
entendiste. Cada dia incluye un reto de "explicalo como si tuvieras que ensenarlo".

## Como medimos el dominio de forma objetiva

Usamos dos instrumentos numericos:

### 1. Quiz diario auto-corregido (recuperacion activa)

- Cada dia tiene un archivo `quiz.json` con preguntas etiquetadas por nivel de
  la taxonomia de Bloom (recordar, comprender, aplicar, analizar).
- Lo respondes en consola con `evaluacion/quiz_runner.py`. Se corrige solo y te
  da: porcentaje total, desglose por nivel de Bloom, y un veredicto de maestria.
- Umbral de maestria: 80%. Es el rango (80-90%) que la practica de "mastery
  learning" considera dominio real, no simple aprobado. Si sacas menos de 80%,
  el sistema te dice exactamente que preguntas fallaste y por que, para que
  repitas SOLO eso.
- Importante: la maestria admite reintentos. No es perfeccion a la primera; es
  alcanzar el umbral, recibir retroalimentacion y volver a demostrarlo.

Como interpretar el resultado:
- >= 90%: dominio solido. Avanza.
- 80-89%: dominio suficiente. Avanza, pero marca lo fallado para repaso espaciado.
- 60-79%: aun no. Repasa lo fallado hoy y reintenta el quiz manana.
- < 60%: rehacer la leccion y la practica antes de reintentar.

### 2. Repaso espaciado con cajas de Leitner (retencion a largo plazo)

El sistema de Leitner es la forma mas simple y transparente de repeticion
espaciada (es el ancestro de algoritmos modernos como FSRS, pero facil de
entender y auditar).

Como funciona:
- Cada tarjeta (pregunta corta) vive en una caja del 1 al 5.
- Caja 1 se repasa cada 1 dia; caja 2 cada 2 dias; caja 3 cada 4 dias; caja 4
  cada 7 dias; caja 5 cada 15 dias.
- Si aciertas una tarjeta, sube de caja (la veras menos seguido).
- Si fallas, vuelve a la caja 1 (la veras pronto otra vez).
- El script `evaluacion/repaso.py` te muestra solo las tarjetas que tocan hoy.

Objetivo medible: que con el tiempo la mayoria de tus tarjetas lleguen a las
cajas 4 y 5. Eso es evidencia objetiva de retencion duradera. `repaso.py` te
muestra cuantas tarjetas tienes en cada caja.

## La rutina diaria (ciclo de aprendizaje)

1. Repaso espaciado (5-10 min): corre `repaso.py` para refrescar lo anterior.
2. Leccion del dia (lee el README del dia, con Composer como guia).
3. Practica (ejecuta los ejercicios). Aprender haciendo.
4. Reto Feynman (explica el concepto con tus palabras en `PROGRESO.md`).
5. Quiz del dia (`quiz_runner.py`). Apunta el porcentaje en `PROGRESO.md`.
6. Si no llegaste a 80%, repite lo fallado y reintenta.

## Por que esto funciona aunque tengas dias sin estudiar

La repeticion espaciada esta disenada justo para eso: aunque pasen dias, las
tarjetas "vencidas" reaparecen y reconstruyes lo olvidado con poco esfuerzo. Por
eso, en dias ocupados, basta con correr `repaso.py` 5 minutos (ver
`MICRO-APRENDIZAJE.md`).

## Fuentes
- Dunlosky, J. et al. (2013). Improving Students' Learning With Effective
  Learning Techniques. Psychological Science in the Public Interest.
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning.
- Ebbinghaus, H. Curva del olvido.
- Sistema de cajas de Leitner (repeticion espaciada).
- Bloom, B. Taxonomia de objetivos educativos y mastery learning.
