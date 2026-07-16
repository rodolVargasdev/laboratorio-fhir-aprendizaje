# Dia 9: Tu propio servidor FHIR (dataset y FHIR store)

Objetivo: tener un servidor FHIR R4 propio donde escribir y leer. Via nube
(Cloud Healthcare API, capa gratuita) o via local (HAPI, ya listo del dia 8).
Tiempo: 2-3 horas. Costo objetivo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion + montar tu store.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 9`.

## Teoria: jerarquia de un FHIR store en GCP

Proyecto > Localizacion (ej. us-central1) > Dataset > FHIR store.

- Dataset: contenedor por region para tus stores de salud.
- FHIR store: el servidor FHIR en si (eliges la version: R4 para certificacion).

El endpoint REST de tu store sera del estilo:

    https://healthcare.googleapis.com/v1/projects/PROJECT/locations/LOCATION/datasets/DATASET/fhirStores/STORE/fhir

Sobre ese endpoint usas los MISMOS GET/POST/PUT/DELETE que aprendiste, pero las
peticiones requieren un token de acceso (autorizacion) de Google.

## Practica

- Via nube: sigue `practica/crear-store.md` (comandos gcloud, capa gratuita).
- Via local: tu servidor del dia 8 ya hace de "store". No hay nada que crear.

Verifica el CapabilityStatement de tu servidor (funciona con ambas vias si
defines FHIR_BASE_URL):

```powershell
python dias\dia-09\practica\capability.py
```

## Reto Feynman

En `PROGRESO.md`, explica la diferencia entre dataset y FHIR store, y por que el
endpoint de GCP necesita un token mientras el servidor publico de pruebas no.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 9. Tema: crear mi propio servidor FHIR (dataset y
FHIR store en Cloud Healthcare API, capa gratuita) o usar mi HAPI local. Soy
desarrollador intermedio, en espanol, mentalidad GCP-first. Sin darme las
respuestas directo, hazme razonar la jerarquia Proyecto>Localizacion>Dataset>
FHIR store, por que el endpoint de GCP pide token y como el CapabilityStatement
me dice que soporta el servidor. Avisame de cualquier paso con riesgo de cobro.
Al final pideme explicar dataset vs FHIR store (Feynman).
