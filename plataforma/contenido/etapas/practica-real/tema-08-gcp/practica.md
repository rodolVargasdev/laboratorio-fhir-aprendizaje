> **Como practicar este tema:** varios ejercicios puedes hacerlos en el navegador desde el [Laboratorio](/laboratorio). Los que piden tu PC usan los scripts en `legacy/dias/`; prepara tu entorno una sola vez con la [guia de setup](/setup).

# Dia 8: Google Cloud - cuenta, proyecto y como NO gastar

Objetivo: dejar listo GCP para practicar FHIR sin gastar (o como mucho centavos),
y tener un plan B 100% gratis con un servidor FHIR local.
Tiempo: 2-3 horas. Costo objetivo: $0.

## Importante sobre tu situacion (sin creditos)

Como tu cuenta ya no tiene credito de bienvenida, seguimos esta regla de oro:

- Cloud Healthcare API tiene CAPA GRATUITA permanente: 25,000 peticiones/mes y
  1 GiB-hora/mes de almacenamiento. Para aprender, cabes de sobra en lo gratis.
- Aun asi, GCP pedira una tarjeta para verificar identidad. No se cobra sin que
  superes la capa gratuita y tengas facturacion activa.
- Plan B garantizado a $0: levantar un servidor FHIR HAPI en tu propia maquina
  (ver `practica/servidor-local.md`). No toca GCP en absoluto.

Recomendacion: hoy elige UNA via.
- Via A (nube, gratis con disciplina): util para tu mentalidad GCP-first.
- Via B (local, cero riesgo de cobro): util si prefieres no dar tarjeta.

Ambas sirven para los dias 9-13. Las practicas leen la variable de entorno
`FHIR_BASE_URL`, asi que funcionan con cualquiera de las dos.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion + elegir via.
3. Practica (configurar la via elegida).
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 8`.

## Teoria: jerarquia de GCP

Organizacion > Proyecto > Recursos. Todo recurso (incluido un FHIR store) vive
dentro de un proyecto. La facturacion se asocia al proyecto.

Herramienta: `gcloud` (CLI de Google Cloud) te deja controlar GCP desde la
terminal.

## Practica

- Via A (nube): sigue `practica/gcp-cuenta.md` (crear proyecto, instalar gcloud,
  poner alertas de presupuesto en $1 como red de seguridad).
- Via B (local): sigue `practica/servidor-local.md` (HAPI FHIR con Docker, gratis).

Comprueba tu gcloud (si elegiste Via A):

```powershell
python legacy\dias\dia-08\practica\comprobar_gcloud.py
```

## Reto Feynman

En `PROGRESO.md`, explica la jerarquia de GCP (organizacion/proyecto/recurso) y
por que la capa gratuita de Healthcare API te alcanza para aprender.

---

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
python legacy\dias\dia-09\practica\capability.py
```

## Reto Feynman

En `PROGRESO.md`, explica la diferencia entre dataset y FHIR store, y por que el
endpoint de GCP necesita un token mientras el servidor publico de pruebas no.

---

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
python legacy\dias\dia-10\practica\cargar_y_consultar.py
```

El script crea un paciente ficticio, le agrega una observacion (frecuencia
cardiaca) referenciandolo, y luego consulta las observaciones de ese paciente.
Reto: agrega una segunda observacion (por ejemplo, temperatura) y vuelve a consultar.

## Reto Feynman

En `PROGRESO.md`, explica como se conecta una Observation con su Patient y por
que las referencias evitan duplicar los datos del paciente en cada observacion.

---

# Dia 20: GCP avanzado (importacion, IAM, metricas y limpieza)

Objetivo: completar la competencia GCP: importar datos sinteticos, roles IAM minimos,
consultar metricas del FHIR store y limpiar recursos para quedar en $0.
Tiempo: 2-3 horas. Costo objetivo: $0 (capa gratuita + borrado al terminar).

## Rutina

1. `python evaluacion\repaso.py`
2. Leccion + guias en `practica/`.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 20`

## Teoria

### Import masivo desde Cloud Storage

Flujo tipico para cargar Synthea (datos ficticios) en tu FHIR store:

1. Subes archivos `.ndjson` a un bucket GCS.
2. Invocas la operacion de import del Healthcare API apuntando al bucket.
3. El servicio ingiere recursos en el FHIR store (validacion incluida).

Comandos detallados: `practica/import-synthea.md`

### IAM: principio de menor privilegio

Roles utiles (no des roles de Owner para practicar):
- `roles/healthcare.fhirResourceEditor` — leer/escribir recursos FHIR
- `roles/healthcare.fhirStoreAdmin` — administrar el store (solo si lo necesitas)
- `roles/healthcare.datasetViewer` — solo lectura de metadatos

Para scripts de practica, preferible una **cuenta de servicio** dedicada con el
rol minimo necesario. Nunca subas el JSON de la clave a git.

### Metricas del FHIR store

El metodo `fhirStores.getFHIRStoreMetrics` devuelve conteo por tipo de recurso y
tamano almacenado. Sirve para estimar coste y verificar que la importacion llego.

### Limpieza obligatoria

Al terminar practicas en nube:

    gcloud healthcare datasets delete integracion-nacional-dataset --location=us-central1

Ver `legacy/legacy/dias/dia-14/practica/limpieza-gcp.md`.

## Practica

**Via nube (si tienes GCP configurado):**

```powershell
python legacy\dias\dia-20\practica\gcp_metricas.py
```

**Via local (sin GCP):** lee `practica/import-synthea.md` y `practica/iam-roles.md`;
el script te indicara que hacer cuando no hay gcloud.

Reto: documenta en `competencias.json` los dominios gcp_datos y gcp_seguridad con
evidencia cuando completes import o IAM en tu proyecto.

## Reto Feynman

Explica por que borrar el dataset al terminar y que rol IAM minimo usarias para
una app que solo lee Observation.