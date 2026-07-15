# Dia 13: Mini-proyecto integrador (resumen clinico)

Objetivo: unir todo lo aprendido en un pequeno programa util: crear datos de un
paciente y generar un resumen clinico legible leyendo desde el servidor FHIR.
Tiempo: 2-3 horas. Costo objetivo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion breve.
3. Practica (el proyecto).
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 13`.

## Que vas a construir

Un script que:
1. Crea un paciente ficticio (Patient).
2. Le agrega varias observaciones (Observation) y una condicion (Condition),
   enlazadas por referencia.
3. Lee de vuelta del servidor y arma un "resumen clinico" legible.

Esto integra: JSON, REST/CRUD, referencias, terminologias y el modelo FHIR.

## Practica

```powershell
# Elige servidor (opcional). Por defecto usa el publico de pruebas.
# Local:  $env:FHIR_BASE_URL = "http://localhost:8080/fhir"
python dias\dia-13\practica\resumen_clinico.py
```

Reto: agrega al resumen el calculo de la edad del paciente a partir de birthDate.

## Limpieza (si usaste la via nube GCP)

Para no gastar credito, borra el dataset al terminar tus practicas en la nube:

```powershell
gcloud healthcare datasets delete integracion-nacional-dataset --location=us-central1
```

Ver mas detalle en `dias\dia-14\practica\limpieza-gcp.md`.

## Reto Feynman

En `PROGRESO.md`, explica que partes del dia 1 al 12 usaste en este mini-proyecto
y por que cada una fue necesaria.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi mentor del Dia 13. Tema: construir un mini-proyecto que crea datos
FHIR y genera un resumen clinico. Soy desarrollador intermedio en la integración nacional, en
espanol, mentalidad GCP-first. Guiame como un par de programacion: hazme proponer
el diseno antes de codificar, revisa mi logica con preguntas, y solo dame pistas
si me atasco. Quiero practicar CRUD, referencias y terminologias juntos. Errores
a vigilar: no enlazar observaciones al paciente, no manejar codigos de estado,
no leer de vuelta del servidor. Al final pideme explicar como integre lo aprendido.
