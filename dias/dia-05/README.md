# Dia 5: Crear y modificar datos (CRUD) en un servidor de pruebas

Objetivo: crear (POST), leer, actualizar (PUT) y borrar (DELETE) recursos, y
entender la idempotencia.
Tiempo: 2-3 horas. Costo: $0 (servidor publico de pruebas; usa datos ficticios).

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 5`.

## Teoria

CRUD = Create, Read, Update, Delete. En FHIR REST:

- Create: POST [base]/Patient con el recurso en el cuerpo. El servidor asigna el
  id y responde 201 Created con la cabecera Location del nuevo recurso.
- Read: GET [base]/Patient/{id}.
- Update: PUT [base]/Patient/{id} con el recurso completo. Si no existe y el
  servidor lo permite, lo crea (update-as-create).
- Delete: DELETE [base]/Patient/{id}.

### Idempotencia (concepto que cae en el examen)

Una operacion es idempotente si repetirla varias veces deja el sistema igual que
hacerla una vez.
- GET, PUT y DELETE son idempotentes.
- POST NO es idempotente: dos POST iguales crean dos recursos distintos.

Analogia: PUT es "deja el documento exactamente asi" (lo repitas o no, queda
igual). POST es "agrega una copia nueva" (cada vez agregas otra).

### Importante (seguridad y etica)

Estas en un servidor publico compartido. Usa SOLO datos ficticios. Nunca subas
datos reales de pacientes a servidores de prueba.

## Practica

```powershell
python dias\dia-05\practica\crud.py
```

El script crea un paciente ficticio, lo lee, lo actualiza y finalmente lo borra,
mostrando el codigo de estado en cada paso.
Reto: tras el DELETE, agrega un GET y observa que codigo de estado devuelve.

## Reto Feynman

En `PROGRESO.md`, explica por que PUT es idempotente y POST no, con un ejemplo.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 5 de FHIR. Tema: CRUD e idempotencia. Soy
desarrollador intermedio, en espanol, mentalidad Google Cloud. No me des
respuestas directas: preguntame primero (recuperacion activa) y corrige con
pistas. Objetivos: (1) crear con POST y entender 201 + Location, (2) leer,
actualizar con PUT y borrar con DELETE, (3) explicar idempotencia (por que PUT y
DELETE si, y POST no). Errores a vigilar: creer que POST es idempotente, olvidar
que PUT necesita el recurso completo, no fijarse en el codigo de estado. Al
final pideme que explique idempotencia (Feynman).
