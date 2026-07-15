> **Como practicar este tema:** varios ejercicios puedes hacerlos en el navegador desde el [Laboratorio](/laboratorio). Los que piden tu PC usan los scripts en `legacy/dias/`; prepara tu entorno una sola vez con la [guia de setup](/setup).

# Dia 18: Busqueda avanzada (chaining, _include, modificadores)

Objetivo: dominar patrones de search que caen en Foundational y Advanced:
encadenado, inclusion de recursos referenciados, modificadores y paginacion.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 18`

## Teoria

### Busqueda encadenada (chaining)

Filtras un recurso A usando un campo que referencia B:

    GET [base]/Observation?subject:Patient.name=Smith

Significa: observaciones cuyo subject (Patient) tiene apellido Smith.

Forma general: `{parametro}:{TipoRecurso}.{campo-en-B}=valor`

### _include y _revinclude

Traen recursos relacionados en el mismo Bundle (evitas N+1 peticiones):

- **_include**: incluye lo que el resultado referencia.
  - `Observation?_include=Observation:subject` trae los Patient referenciados.
- **_revinclude**: incluye recursos que referencian al resultado.
  - `Patient?_revinclude=Observation:subject` trae observaciones de esos pacientes.

### Modificadores de parametros

Se anaden con `:` al nombre del parametro:
- `:exact` — coincidencia exacta (nombres)
- `:missing` — true/false si el elemento esta presente
- `:not` — negacion (donde el servidor lo soporte)

Ejemplo: `Patient?name:exact=John`

### Paginacion

El Bundle trae `link` con `relation: "next"` para la siguiente pagina.
Parametro `_count` limita resultados por pagina.

## Practica

```powershell
python legacy\dias\dia-18\practica\busqueda_avanzada.py
```

Ejecuta varios patrones y muestra cuantos recursos devolvio el Bundle y si trajo
includes. Reto: agrega una busqueda con `Patient?_revinclude=Observation:subject`.

## Reto Feynman

Explica cuando usarias `_include` vs hacer un GET separado por cada referencia.