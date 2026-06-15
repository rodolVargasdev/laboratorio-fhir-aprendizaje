# Limpieza de recursos en Google Cloud (para quedar a 0 dolares)

Haz esto solo si usaste la via nube (GCP). Si solo usaste el servidor local o el
publico de pruebas, no hay nada que limpiar.

## Paso 1: borrar el dataset (elimina sus FHIR stores)

```powershell
gcloud healthcare datasets delete doctorsv-dataset --location=us-central1
```

Te pedira confirmacion. Esto borra el dataset y todo lo que contiene.

## Paso 2: confirmar que ya no existe

```powershell
gcloud healthcare datasets list --location=us-central1
```

No deberia aparecer doctorsv-dataset.

## Paso 3 (opcional): revisar facturacion

1. Consola GCP > Facturacion > Informes.
2. Filtra por el proyecto. El gasto deberia ser 0 o unos pocos centavos.

## Paso 4 (opcional, maxima seguridad): cerrar el proyecto

Si no vas a usar mas GCP por ahora:
1. Consola GCP > IAM y administracion > Configuracion.
2. "Cerrar proyecto" (shut down). Esto detiene cualquier posible cobro futuro.
   Puedes restaurarlo dentro de un plazo si te arrepientes.

## Buenas practicas de seguridad

- Nunca subas a git las claves de cuenta de servicio (*.json). El .gitignore ya
  las excluye.
- No reutilices datos reales de pacientes en entornos de practica.
