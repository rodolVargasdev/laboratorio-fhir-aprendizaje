# Via A: poner a punto Google Cloud (gratis, con red de seguridad)

Sigue estos pasos solo si elegiste la via nube. Si prefieres cero riesgo de
cobro, usa `servidor-local.md` en su lugar.

## Paso 1: Crear/seleccionar proyecto
1. Entra a https://console.cloud.google.com/ con tu cuenta Google.
2. En el selector de proyectos (arriba), pulsa "Nuevo proyecto".
3. Nombre: `doctorsv-fhir-lab`. Crealo y seleccionalo.

## Paso 2: Activar facturacion (necesario aunque uses capa gratuita)
1. Menu > Facturacion. Asocia una cuenta de facturacion al proyecto.
2. Google pide una tarjeta para verificar identidad. No cobra mientras te
   mantengas en la capa gratuita.

## Paso 3 (CLAVE): alerta de presupuesto en 1 dolar
Esta es tu red de seguridad para no llevarte sorpresas.
1. Facturacion > Presupuestos y alertas > Crear presupuesto.
2. Ambito: el proyecto `doctorsv-fhir-lab`.
3. Importe objetivo: 1 (un dolar).
4. Activa alertas al 50%, 90% y 100%. Te llegara correo si te acercas a 1 dolar.

Nota: un presupuesto avisa, no corta el gasto automaticamente. Por eso ademas
borraremos los recursos al terminar (dia 13/14).

## Paso 4: Instalar gcloud (CLI)
1. Descarga: https://cloud.google.com/sdk/docs/install
2. En PowerShell:

   ```powershell
   gcloud init
   gcloud config set project doctorsv-fhir-lab
   gcloud config list
   ```

## Paso 5: Habilitar la API de Healthcare

```powershell
gcloud services enable healthcare.googleapis.com
```

Listo. En el dia 9 crearas el dataset y el FHIR store.
