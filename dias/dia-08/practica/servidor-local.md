# Via B: servidor FHIR local con HAPI (100% gratis, sin GCP)

Esta via levanta un servidor FHIR R4 en tu propia maquina. No usa GCP, asi que no
hay ningun riesgo de cobro. Es ideal dada tu situacion sin creditos.

## Opcion B1: con Docker (recomendada, mas simple)

Requisito: Docker Desktop instalado (https://www.docker.com/products/docker-desktop/).

1. Abre PowerShell y ejecuta:

   ```powershell
   docker run -p 8080:8080 hapiproject/hapi:latest
   ```

2. Espera 1-2 minutos. Cuando veas mensajes de "Started", abre el navegador en:

   http://localhost:8080/

   La base FHIR sera: http://localhost:8080/fhir

3. Para que las practicas usen tu servidor local, define la variable de entorno
   en la MISMA terminal donde corres Python:

   ```powershell
   $env:FHIR_BASE_URL = "http://localhost:8080/fhir"
   ```

4. Para detener el servidor: Ctrl+C en la ventana de Docker, o cierra la ventana.

## Opcion B2: sin Docker (CLI de HAPI)

Requisito: Java instalado.
1. Descarga el CLI desde https://github.com/hapifhir/hapi-fhir/releases
   (archivo `hapi-fhir-[version]-cli.zip`).
2. Descomprime y ejecuta:

   ```powershell
   .\hapi-fhir-cli.cmd run-server
   ```

3. Servidor en http://localhost:8080/ (revisa la ruta base que imprime).

## Nota

Si no quieres instalar nada, puedes seguir usando el servidor publico
https://hapi.fhir.org/baseR4 (es el valor por defecto de las practicas). El
servidor local solo te da control total y privacidad para experimentar.
