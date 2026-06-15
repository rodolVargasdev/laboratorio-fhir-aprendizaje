# Dia 10: Cargar y consultar datos FHIR

Objetivo: poblar tu servidor con datos ficticios y consultarlos, uniendo recursos
con referencias (un paciente y sus observaciones).
Tiempo: 2-3 horas. Costo objetivo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 10`.

## Teoria

### Datos sinteticos (Synthea)

Para practicar sin datos reales se usan generadores como Synthea, que crean
pacientes ficticios completos (con historia clinica) en formato FHIR. Puedes
descargar muestras desde https://synthea.mitre.org/downloads. No es obligatorio
hoy: la practica crea sus propios datos minimos.

### Referencias entre recursos

Los recursos FHIR se enlazan por referencias. Una Observation apunta a su paciente:

```json
"subject": { "reference": "Patient/123" }
```

Asi, al crear un paciente y luego una observacion con su id, quedan conectados.

### Transacciones por Bundle (opcional)

Se pueden enviar varios recursos a la vez en un Bundle de tipo "transaction" con
un POST a la base. Util para cargar datos relacionados de forma atomica.

## Practica

Define a que servidor apuntas (si no, usa el publico por defecto):

```powershell
# Local:  $env:FHIR_BASE_URL = "http://localhost:8080/fhir"
# GCP:    define FHIR_BASE_URL y TOKEN (ver dia 9)
python dias\dia-10\practica\cargar_y_consultar.py
```

El script crea un paciente ficticio, le agrega una observacion (frecuencia
cardiaca) referenciandolo, y luego consulta las observaciones de ese paciente.
Reto: agrega una segunda observacion (por ejemplo, temperatura) y vuelve a consultar.

## Reto Feynman

En `PROGRESO.md`, explica como se conecta una Observation con su Patient y por
que las referencias evitan duplicar los datos del paciente en cada observacion.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 10. Tema: cargar y consultar datos FHIR, y enlazar
recursos con referencias. Soy desarrollador intermedio, en espanol, mentalidad
GCP-first. Sin darme respuestas directas, guiame a entender datos sinteticos
(Synthea), como una Observation referencia a su Patient (subject.reference) y que
es una transaccion por Bundle. Errores a vigilar: olvidar el prefijo del tipo en
la referencia (Patient/123), crear la observacion sin subject. Al final pideme
explicar las referencias entre recursos (Feynman).
