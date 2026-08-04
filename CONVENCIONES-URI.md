# Convenciones de URI (decisión institucional)

Este documento fija el espacio de nombres FHIR de la institución. Es una decisión de
gobernanza, no una preferencia de estilo: **una canónica publicada no se cambia**, porque
cambiarla obliga a versionar todos los perfiles y a migrar los datos que ya la citan.

Fecha de la decisión: 2026-08-04. Origen: auditoría del `RiskAssessment` del orquestador
de prevención (tema 11 del laboratorio).

## La tabla

| Tipo de URI | Convención | Ejemplo | ¿Debe resolver? |
|---|---|---|---|
| Perfiles (StructureDefinition) | `http://goes.gob.sv/fhir/StructureDefinition/<id>` | `.../StructureDefinition/paciente-nacional` | Idealmente sí; es ante todo un identificador |
| Extensiones | `http://goes.gob.sv/fhir/StructureDefinition/<id>` | `.../StructureDefinition/fase-estado-prevencion` | Igual: una extensión **es** una StructureDefinition |
| CodeSystem | `http://goes.gob.sv/fhir/CodeSystem/<id>` | `.../CodeSystem/prevention-phase` | Sí |
| ValueSet | `http://goes.gob.sv/fhir/ValueSet/<id>` | `.../ValueSet/prevention-phase` | Sí |
| ConceptMap | `http://goes.gob.sv/fhir/ConceptMap/<id>` | `.../ConceptMap/tca-a-loinc` | Sí |
| Identificadores del mundo real | `http://goes.gob.sv/fhir/sid/<id>` | `.../sid/dui`, `.../sid/expediente` | No: nombra un espacio de identificación |
| **Endpoints de servicio** | `https://<servicio>.salud.gob.sv/...` | `https://fhir.salud.gob.sv/r4`, `https://auth.salud.gob.sv` | **Sí, y con TLS** |

## Por qué `goes.gob.sv` y no `fhir.salud.gob.sv`

El orquestador de prevención **ya emite en producción** recursos con
`http://goes.gob.sv/fhir/...`. Cambiar la canónica costaría migrar datos reales; alinear
el material de estudio costó un find-replace. La estabilidad le gana a la elegancia.

## Por qué las canónicas usan `http://` y los endpoints `https://`

Porque son cosas distintas. Una canónica **identifica** una definición; un endpoint es una
**dirección de red**. La propia HL7 publica `http://hl7.org/fhir/StructureDefinition/Patient`.
"Corregir" el esquema de una canónica publicada por estética rompe en silencio a todos los
consumidores que la comparan como cadena.

## Regla de cambio

Cualquier URI de esta tabla solo cambia con una versión mayor de la guía de implementación
nacional, con periodo de convivencia y con un `ConceptMap` o una nota de migración. Nunca
por conveniencia de un sprint.

## Pendiente

Nada de esto está publicado todavía: los códigos de fase, tipo y grado de prevención
existen en los datos pero no tienen `CodeSystem` ni `ValueSet` definidos. Ese es el primer
entregable de la guía de implementación nacional (tema 11).
