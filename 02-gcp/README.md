# Semana 2: Google Cloud Platform paso a paso

Esta guia es para tu situacion concreta: tienes cuenta de Google, pero todavia
no tienes proyecto ni facturacion de GCP configurada. La haremos en el Dia 8.

Importante sobre costes: Google da credito gratuito de bienvenida para clientes
nuevos y un nivel gratuito permanente para varios servicios. Aun asi, te pedira
una tarjeta para verificar identidad. No se cobra automaticamente al acabar el
credito sin tu permiso. Aun asi, te ensenare a borrar los recursos al final para
quedar a cero.

## Dia 8 - Cuenta, proyecto y facturacion

### Paso 1: Activar la prueba gratuita de Google Cloud
1. Entra a https://cloud.google.com/free e inicia sesion con tu cuenta Google.
2. Pulsa "Empezar gratis" / "Get started for free".
3. Acepta terminos y registra un metodo de pago (es solo verificacion).
4. Al terminar tendras credito gratuito de bienvenida disponible.

### Paso 2: Crear un proyecto
Un proyecto es el contenedor de todos tus recursos en GCP.
1. Ve a https://console.cloud.google.com/
2. Arriba, en el selector de proyectos, pulsa "Nuevo proyecto".
3. Nombre sugerido: `doctorsv-fhir-lab`. Crea el proyecto y seleccionalo.

### Paso 3: Instalar Google Cloud CLI (gcloud)
La herramienta `gcloud` te deja controlar GCP desde PowerShell.
1. Descarga el instalador desde:
   https://cloud.google.com/sdk/docs/install
2. Instala y, al terminar, en PowerShell:

   ```powershell
   gcloud init
   ```

   Esto abre el navegador para iniciar sesion y te deja elegir el proyecto
   `doctorsv-fhir-lab`.

3. Verifica:

   ```powershell
   gcloud config list
   ```

## Dia 9 - Cloud Healthcare API: dataset y FHIR store

### Paso 1: Habilitar las APIs necesarias

```powershell
gcloud services enable healthcare.googleapis.com
```

### Paso 2: Crear un dataset
Jerarquia en GCP: Proyecto > Localizacion > Dataset > FHIR store.

```powershell
gcloud healthcare datasets create doctorsv-dataset --location=us-central1
```

### Paso 3: Crear un FHIR store version R4

```powershell
gcloud healthcare fhir-stores create doctorsv-fhir-store `
  --dataset=doctorsv-dataset `
  --location=us-central1 `
  --version=R4 `
  --enable-update-create
```

El simbolo de acento grave al final de cada linea es el "continuador de linea"
de PowerShell (equivale a poner todo en una sola linea).

### Paso 4: Confirmar que existe

```powershell
gcloud healthcare fhir-stores list `
  --dataset=doctorsv-dataset `
  --location=us-central1
```

## Dia 10 - Cargar y consultar datos (resumen, lo detallamos ese dia)

- Generaremos o descargaremos datos sinteticos (Synthea) en formato FHIR.
- Los importaremos al FHIR store desde Cloud Storage.
- Haremos consultas REST contra tu servidor FHIR en la nube, igual que en la
  semana 1 pero ahora sobre infraestructura propia de GCP.

## Limpieza al final (para no gastar credito)

Cuando termines de practicar, borra los recursos:

```powershell
gcloud healthcare datasets delete doctorsv-dataset --location=us-central1
```

Esto elimina el dataset y sus FHIR stores. Si quieres, tambien puedes apagar la
facturacion del proyecto desde la consola de GCP.

## Seguridad (recordatorio)

- Nunca subas a git las claves de cuentas de servicio (*.json). El archivo
  `.gitignore` del proyecto ya las excluye.
- Usa solo datos sinteticos. No subas datos reales de pacientes a servidores de
  practica ni a un store de pruebas sin las protecciones adecuadas.
