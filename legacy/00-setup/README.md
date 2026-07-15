# Dia 0: Preparacion del entorno

Objetivo: dejar tu computadora lista para programar y hablar con servidores FHIR.
Tiempo estimado: 30-45 minutos. Solo se hace una vez.

Trabajas en Windows con PowerShell, asi que los comandos estan en ese formato.

## Paso 1: Comprobar que tienes Python

En PowerShell, escribe:

```powershell
python --version
```

- Si ves algo como `Python 3.11.x` o superior, perfecto, pasa al Paso 2.
- Si da error o dice que no se reconoce el comando, instala Python desde
  https://www.python.org/downloads/ y MUY IMPORTANTE: en la primera pantalla
  del instalador marca la casilla "Add python.exe to PATH". Luego cierra y
  vuelve a abrir PowerShell y repite el comando.

## Paso 2: Crear un entorno virtual (aislar las librerias del proyecto)

Un entorno virtual es una "caja" donde se instalan las librerias solo para este
proyecto, sin ensuciar el resto del sistema. Es la buena practica estandar.

Situate en la carpeta del proyecto y crealo:

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje
python -m venv .venv
```

Activalo (veras que aparece `(.venv)` al inicio de la linea):

```powershell
.\.venv\Scripts\Activate.ps1
```

Si PowerShell bloquea el script con un error de "execution policy", ejecuta una
sola vez lo siguiente y vuelve a activar:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Paso 3: Instalar las librerias del laboratorio

Con el entorno activado `(.venv)`:

```powershell
pip install -r requirements.txt
```

Esto instala `requests` (para llamar APIs), `rich` (para imprimir bonito) y,
para la semana 2, el cliente de Google Cloud.

## Paso 4: Verificar que todo funciona

Ejecuta el script de comprobacion:

```powershell
python 00-setup\verificar_entorno.py
```

Si ves el mensaje "Entorno listo", ya puedes empezar el Dia 1.

## Paso 5 (opcional pero recomendado): un cliente REST visual

Para "ver" las peticiones a servidores FHIR de forma grafica, instala uno de
estos (gratuitos). No es obligatorio porque tambien lo haremos con Python:

- Bruno: https://www.usebruno.com/ (ligero, guarda todo en archivos locales)
- Insomnia: https://insomnia.rest/
- Postman: https://www.postman.com/

Recomendacion: Bruno, porque es local y simple, alineado con tu preferencia de
mantener todo en local.

## Recordatorio para los proximos dias

Cada vez que abras una nueva ventana de PowerShell para trabajar, activa el
entorno primero:

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje
.\.venv\Scripts\Activate.ps1
```
