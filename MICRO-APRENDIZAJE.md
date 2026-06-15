# Micro-aprendizaje: mantener todo fresco en dias ocupados

Habra dias en que no puedas estudiar a fondo. No pasa nada: la repeticion
espaciada esta disenada justo para eso. Con 5-15 minutos mantienes la memoria
viva y evitas empezar de cero. La regla es: mejor 10 minutos hoy que 2 horas
"algun dia".

## Rutina de 5 minutos (la minima viable)

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje
.\.venv\Scripts\Activate.ps1
python evaluacion\repaso.py --max 8
```

Repasas solo las tarjetas que tocan hoy (recuperacion activa). Si fallas alguna,
el sistema la traera pronto otra vez. Eso es todo.

## Rutina de 10 minutos

1. Repaso de tarjetas: `python evaluacion\repaso.py`
2. Una pregunta intercalada: `python evaluacion\quiz_runner.py --repaso --n 3`

## Rutina de 15 minutos

1. `python evaluacion\repaso.py`
2. `python evaluacion\quiz_runner.py --repaso --n 5`
3. Feynman relampago: elige UN concepto y explicalo en voz alta en 60 segundos,
   como si se lo contaras a alguien. Si te trabas, ahi esta tu punto debil.

## Micro-aprendizaje con Composer 2.5 (sin abrir nada mas)

Pega esto en el chat con Composer:

  Hazme 3 preguntas rapidas de recuperacion activa sobre FHIR (mezcla JSON, REST,
  terminologias y seguridad), una a la vez, esperando mi respuesta antes de la
  siguiente. Corrige con una pista si fallo y dime que dia (1-14) repasar.

## Ideas de micro-aprendizaje "sin pantalla"

- Mientras caminas: explica en voz alta la diferencia entre GET y POST, o entre
  LOINC y SNOMED.
- En una nota del telefono: escribe una ruta FHIR de memoria (ej. la de un valor
  de Observation) y verificala despues.
- Antes de dormir: recuerda 3 codigos de estado HTTP y que significan.

## Como saber si el micro-aprendizaje esta funcionando

Corre de vez en cuando:

```powershell
python evaluacion\repaso.py --estado
```

Si tus tarjetas van subiendo a las cajas 4 y 5, vas bien: estas reteniendo a
largo plazo con poco esfuerzo diario. Si muchas vuelven a la caja 1, dedica una
sesion normal a ese tema.

## Si estuviste varios dias sin estudiar

No intentes recuperar todo de golpe. Haz 2-3 dias seguidos de la rutina de 10-15
minutos: el sistema de Leitner reordena lo vencido y en pocos dias vuelves al
ritmo. Lo importante es retomar, no la perfeccion.
