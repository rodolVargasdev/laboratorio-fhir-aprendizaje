# Plan de 2 semanas: cimientos de software para FHIR (GCP-first)

Perfil para el que esta calibrado este plan:
- Nivel intermedio (programas, entiendes JSON, has tocado alguna API).
- Dedicacion 2-3 horas por dia.
- Lenguaje de practica: Python.
- Google Cloud: cuenta Google existente, falta proyecto y facturacion.

Cada dia tiene un objetivo claro, una parte de teoria corta y una parte de
practica que ejecutas. Si un dia se complica, NO te saltes la practica: es
donde de verdad se fijan los conceptos. Marca tu avance en `PROGRESO.md`.

---

## Semana 1: Cimientos de software

### Dia 1 - Entorno + JSON + primer GET a un servidor FHIR
- Teoria: que es JSON y por que FHIR lo usa. Objetos, arrays, tipos.
- Practica: `01-fundamentos-software/json/` leer un recurso Patient real
  desde el servidor publico HAPI FHIR con Python.
- Resultado esperado: imprimes el nombre de un paciente desde JSON real.

### Dia 2 - JSON a fondo + XML comparado
- Teoria: anidamiento, rutas (path) dentro de un JSON, JSON vs XML.
- Practica: navegar un recurso FHIR complejo y extraer campos especificos.

### Dia 3 - HTTP y REST (parte 1)
- Teoria: cliente/servidor, URL, metodos GET/POST/PUT/DELETE, cabeceras.
- Practica: hacer GET de distintos tipos de recurso y leer la respuesta.

### Dia 4 - REST (parte 2): codigos de estado y busqueda
- Teoria: codigos 2xx/4xx/5xx, parametros de busqueda (search).
- Practica: buscar pacientes por nombre y observaciones por fecha.

### Dia 5 - Crear y modificar datos (CRUD) en un servidor de pruebas
- Teoria: POST (crear), PUT (actualizar), DELETE, idempotencia.
- Practica: crear tu propio recurso en un servidor de pruebas y recuperarlo.

### Dia 6 - Seguridad web: OAuth 2.0 y SMART on FHIR (concepto)
- Teoria: autenticacion vs autorizacion, tokens, flujos, SMART Backend Services.
- Practica: leer y entender un token; probar el sandbox SMART Bulk Data.

### Dia 7 - Repaso activo y consolidacion
- Autoevaluacion de la semana 1. Repetir los ejercicios mas flojos.

---

## Semana 2: Google Cloud + terminologias + primer FHIR real

### Dia 8 - Google Cloud: cuenta, proyecto y facturacion (free tier)
- Teoria: jerarquia de GCP (organizacion > proyecto > recursos), creditos gratis.
- Practica: crear proyecto, activar facturacion con credito gratuito, instalar gcloud.

### Dia 9 - Cloud Healthcare API: dataset y FHIR store
- Teoria: jerarquia Proyecto > Localizacion > Dataset > FHIR store.
- Practica: habilitar la API, crear dataset y un FHIR store R4.

### Dia 10 - Cargar y consultar datos FHIR en GCP
- Teoria: importacion de datos (Synthea), REST sobre tu FHIR store.
- Practica: subir datos sinteticos y hacer tus primeras consultas en la nube.

### Dia 11 - Terminologias clinicas
- Teoria: LOINC, SNOMED CT, CodeableConcept vs Coding, fuerza de binding.
- Practica: identificar codigos en recursos reales y entender su significado.

### Dia 12 - Primer contacto con el modelo FHIR
- Teoria: recursos comunes (Patient, Observation, Encounter), referencias, Bundle.
- Practica: recorrer un Bundle y mapear un caso de uso de DoctorSV a recursos.

### Dia 13 - Mini-proyecto integrador
- Practica: pequeno script Python que lee de tu FHIR store en GCP, filtra y
  muestra un resumen clinico simple. Une todo lo aprendido.

### Dia 14 - Cierre, autoevaluacion final y plan de continuacion
- Autoevaluacion global. Definir el siguiente tramo: ruta hacia el examen
  Foundational Implementer con experiencia practica acumulada.

---

## Reglas del juego

- Repeticion espaciada: cada dia, 10 minutos repasando lo del dia anterior.
- Si algo no quedo claro, marcalo en `PROGRESO.md` y lo reforzamos.
- Coste: todo lo de la semana 1 es gratis (servidores publicos). En la semana 2,
  GCP se usa dentro del credito gratuito; veras como evitar cargos.
