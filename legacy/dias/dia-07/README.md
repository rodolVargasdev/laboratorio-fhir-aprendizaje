# Dia 7: Repaso activo y consolidacion (Semana 1)

Objetivo: consolidar JSON, REST, CRUD y seguridad con recuperacion activa e
intercalado. Hoy NO hay tema nuevo: hoy demuestras lo aprendido.
Tiempo: 2-3 horas. Costo: $0.

## Rutina de hoy

1. Repaso espaciado completo:

   ```powershell
   python evaluacion\repaso.py
   python evaluacion\repaso.py --estado
   ```

   Mira cuantas tarjetas ya estan en cajas 3-5 (retencion creciente).

2. Quiz intercalado (mezcla preguntas de los dias 1-6):

   ```powershell
   python evaluacion\quiz_runner.py --repaso --n 15
   ```

3. Quiz de consolidacion de la semana:

   ```powershell
   python evaluacion\quiz_runner.py --dia 7
   ```

4. Repite la practica del dia que peor te haya salido (segun el desglose por
   Bloom y las preguntas falladas).

## Checklist objetivo de la Semana 1 (marca lo que ya dominas)

- [ ] Leo JSON anidado y uso rutas (Patient.name[0].family).
- [ ] Distingo objeto { } de array [ ].
- [ ] Hago GET (read) y search en FHIR.
- [ ] Interpreto codigos 2xx/4xx/5xx.
- [ ] Construyo busquedas con parametros y prefijos de fecha.
- [ ] Ejecuto un ciclo CRUD y explico la idempotencia.
- [ ] Explico authn vs authz, OAuth y SMART on FHIR, y scopes.

Criterio para avanzar a la Semana 2: quiz del dia 7 >= 80% y la mayoria del
checklist marcado. Si no, dedica este dia (o uno extra) a reforzar.

## Reto Feynman (integrador)

En `PROGRESO.md`, explica en un parrafo el viaje completo de un dato clinico:
desde que una app pide autorizacion (SMART/OAuth), hace un GET a un servidor FHIR,
recibe un Bundle en JSON, y tu lees un valor con una ruta. Usa tus palabras.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor de repaso del Dia 7 (consolidacion Semana 1: JSON, REST,
CRUD, seguridad). Soy desarrollador intermedio, en espanol. Hazme un repaso por
recuperacion activa: preguntame de forma intercalada (mezclando temas), de mas
facil a mas dificil, sin darme las respuestas de inmediato. Detecta mis puntos
debiles y dime exactamente que dia repasar. Termina pidiendome que explique, con
mis palabras, el viaje completo de un dato clinico desde la autorizacion hasta
leer un valor con una ruta (Feynman).
