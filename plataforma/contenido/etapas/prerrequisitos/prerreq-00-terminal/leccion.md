# La terminal y tu entorno

> **En simple:** la terminal es una ventanilla de trámites donde le hablas a la computadora por escrito y con frases precisas, en vez de señalar con el dedo (que es lo que haces con el mouse). A cambio de aprender ese "idioma de ventanilla", obtienes algo que el mouse nunca te dará: poder repetir, automatizar y diagnosticar cualquier cosa. Todo el mundo FHIR — servidores, validadores, scripts — vive ahí.

## Por qué un futuro experto en FHIR necesita la terminal

Casi todas las herramientas serias de interoperabilidad son programas de línea de comandos: `curl` para hablar con una API FHIR, `python` para transformar datos, `git` para versionar tus perfiles, el validador oficial de HL7 (`java -jar validator_cli.jar`). Los servidores donde correrá tu integración nacional no tienen escritorio ni íconos: solo una terminal remota.

Hay una segunda razón, más profunda: **reproducibilidad**. Una secuencia de clics no se puede anotar, compartir ni repetir con exactitud. Un comando sí. Cuando documentes un despliegue o reportes un error, vas a pegar comandos y sus salidas, no capturas de pantalla de menús. Quien dirige interoperabilidad no necesita ser la persona más rápida tecleando, pero sí leer una terminal sin miedo.

La interfaz gráfica (GUI, *Graphical User Interface*) y la línea de comandos (CLI, *Command Line Interface*) no compiten: son dos formas de pedirle lo mismo al sistema operativo. La GUI es cómoda para explorar; la CLI es precisa para trabajar.

## Terminal, consola y shell: tres palabras que no son lo mismo

Se usan como sinónimos, pero conviene separarlas:

- **Terminal**: la ventana. Un programa que dibuja texto y recibe tu teclado (Windows Terminal, la app Terminal de macOS, GNOME Terminal en Linux).
- **Shell**: el intérprete que corre *dentro* de la ventana. Es el programa que lee tu línea, la entiende y ejecuta. Ejemplos: **PowerShell** (Windows moderno), **bash** y **zsh** (Linux y macOS), **cmd** (el Windows antiguo; evítalo).
- **Prompt**: el texto que el shell imprime para decir "listo, escribe". En PowerShell se ve como `PS C:\Users\ana>`; en bash, algo como `ana@equipo:~$`.

La analogía: la terminal es el teléfono, el shell es la persona que contesta, y el prompt es su "¿aló, en qué le ayudo?". Este curso usa PowerShell en Windows y bash cuando trabajes contra servidores Linux; los conceptos son idénticos y solo cambian algunos nombres de comandos.

Para abrirla: en Windows busca "PowerShell" o "Terminal" en el menú de inicio; en macOS, Terminal (Aplicaciones > Utilidades); en Linux, normalmente `Ctrl+Alt+T`.

## Anatomía de un comando

Todo comando tiene la misma estructura: un **programa**, seguido opcionalmente de **argumentos** (sobre qué actuar) y **flags** u opciones (cómo actuar). Los separa el espacio, por eso el espacio importa tanto.

```powershell
python script.py --verbose
```

- `python` — el programa que se ejecuta.
- `script.py` — argumento: el archivo que Python debe correr.
- `--verbose` — flag: modifica el comportamiento (aquí, "habla más").

Convenciones que verás siempre:

- Flags cortos con un guion (`-h`), largos con dos (`--help`). En PowerShell los parámetros llevan un guion y nombre completo: `Get-ChildItem -Recurse`.
- Muchos programas tienen **subcomandos**: en `git status`, `status` es el subcomando de `git`.
- Si un argumento contiene espacios, va entre comillas: `cd "C:\Mis Documentos"`. Sin comillas, el shell cree que son dos argumentos.

Un ejemplo real que usarás pronto contra un servidor FHIR:

```bash
curl -H "Accept: application/fhir+json" "https://hapi.fhir.org/baseR4/Patient?_count=2"
```

Aquí `curl` es el programa, `-H "..."` es un flag que agrega un header HTTP y la URL es el argumento. Todavía no importa qué significa: importa que ya puedes *desarmarlo* en sus piezas.

Casi todo programa acepta `--help` (o `-h`, o en PowerShell `Get-Help comando`). Es la primera puerta cuando no recuerdas la sintaxis.

## Rutas: la dirección exacta de cada archivo

La terminal siempre está "parada" en una carpeta: el **directorio de trabajo**. Todos los comandos se interpretan desde ahí. Para saber dónde estás:

```powershell
pwd    # PowerShell y bash lo aceptan; en PowerShell equivale a Get-Location
```

Una **ruta absoluta** describe la ubicación desde la raíz del disco y funciona sin importar dónde estés parado: `C:\Users\ana\fhir\paciente.json` (Windows) o `/home/ana/fhir/paciente.json` (Linux). Una **ruta relativa** se interpreta desde el directorio de trabajo: `fhir\paciente.json` significa "dentro de la carpeta actual, la subcarpeta fhir, y ahí el archivo".

Dos nombres especiales aparecen en toda ruta relativa:

- `.` — la carpeta actual.
- `..` — la carpeta padre (un nivel arriba).

Windows separa con `\` y Linux/macOS con `/`; PowerShell acepta ambos, así que acostúmbrate a `/`, que funciona en todos lados. Los comandos de movimiento básico:

| Acción | PowerShell (Windows) | bash (Linux/macOS) |
|---|---|---|
| ¿Dónde estoy? | `pwd` | `pwd` |
| Listar contenido | `ls` (alias de `Get-ChildItem`) o `dir` | `ls` |
| Cambiar de carpeta | `cd fhir` | `cd fhir` |
| Subir un nivel | `cd ..` | `cd ..` |
| Crear carpeta | `mkdir laboratorio` | `mkdir laboratorio` |
| Ver un archivo de texto | `cat archivo.txt` | `cat archivo.txt` |

Si escribes `cd carpeta-que-no-existe`, el shell responde con un error del tipo "no se encuentra la ruta". No pasó nada malo: solo te dijo que esa dirección no existe desde donde estás parado. Revisa con `ls` qué hay realmente y vuelve a intentar.

## Variables de entorno y el PATH: por qué "python no se reconoce"

Una **variable de entorno** es un dato con nombre que el sistema le entrega a cada programa al arrancar: dónde está tu carpeta de usuario, qué idioma usas, credenciales de configuración. Para verlas:

```powershell
$env:USERPROFILE     # PowerShell: imprime C:\Users\tu-usuario
echo $HOME           # bash: imprime /home/tu-usuario
```

La más importante para ti es **PATH**: una lista de carpetas, separadas por `;` en Windows y `:` en Linux, donde el shell busca los programas. Cuando escribes `python`, el shell no adivina: recorre las carpetas del PATH en orden y ejecuta el primer `python.exe` que encuentre.

Esto explica el error más famoso para principiantes:

```text
python : El término 'python' no se reconoce como nombre de un cmdlet...
```

Traducción: "busqué en todas las carpetas de mi PATH y no encontré ningún programa llamado python". Las causas posibles, en orden de probabilidad: no está instalado; está instalado pero su carpeta no se agregó al PATH; o lo instalaste con la terminal abierta (la terminal lee el PATH al abrirse, así que ciérrala y ábrela de nuevo).

Para diagnosticar dónde está (o no está) un programa:

```powershell
where.exe python     # PowerShell: lista las rutas donde lo encontró
which python         # bash: lo mismo
$env:Path            # PowerShell: ver el PATH completo
```

Entender el PATH te acompañará todo el curso: los entornos virtuales de Python (tema de Python) funcionan precisamente manipulando el PATH.

## Salidas, errores y códigos de salida

Cada programa que corres tiene **dos canales de salida** aunque en pantalla se mezclen: **stdout** (salida estándar, los resultados normales) y **stderr** (salida de error, los avisos y fallos). Separarlos permite, por ejemplo, guardar los resultados en un archivo mientras los errores siguen apareciendo en pantalla.

Además, todo programa termina con un **código de salida**: un número invisible donde `0` significa "terminé bien" y cualquier otro valor significa "algo falló". Los scripts de automatización dependen de esto para decidir si continuar. Puedes consultarlo justo después de un comando:

```powershell
$LASTEXITCODE    # PowerShell
echo $?          # bash (0 = bien)
```

### Leer un error sin pánico

Un mensaje de error es un informe, no una acusación. Método en cuatro pasos:

1. **Respira: no rompiste nada.** Un error de comando casi nunca daña el sistema; solo te informa.
2. **Lee la primera y la última línea.** La primera suele decir qué comando falló; la última, la causa concreta ("no se encuentra la ruta", "permiso denegado", "no se reconoce").
3. **Busca nombres tuyos en el mensaje**: el archivo, la carpeta o el comando que escribiste. Ahí suele estar el dedo que señala el problema (una letra de más, una carpeta equivocada).
4. **Copia el mensaje completo** si vas a pedir ayuda (al tutor de la app o a un buscador). "Me salió un error rojo" no es diagnosticable; el texto exacto sí.

## Encadenar y guardar: pipes y redirección

El diseño más elegante de la terminal: la salida de un programa puede ser la entrada de otro. El conector es el **pipe** (`|`, tubería):

```powershell
Get-ChildItem | Measure-Object     # PowerShell: cuenta cuántos elementos hay en la carpeta
```

```bash
ls | wc -l                          # bash: la misma idea
curl -s "https://hapi.fhir.org/baseR4/metadata" | python -m json.tool
```

El último ejemplo es puro oficio FHIR: `curl` descarga el JSON del servidor y se lo pasa por la tubería a Python, que lo imprime formateado y legible.

La **redirección** manda la salida a un archivo en lugar de a la pantalla: `>` crea o sobrescribe, `>>` agrega al final.

```powershell
python informe.py > resultado.txt     # guarda la salida
python informe.py >> historial.txt    # la agrega sin borrar lo anterior
```

Con pipes y redirección entiendes la filosofía completa: programas pequeños que hacen una cosa bien, conectados como tubería de agua.

## Atajos que te ahorran horas

- **Tab (autocompletar)**: escribe las primeras letras de un archivo, carpeta o comando y presiona Tab; el shell lo completa. Es el atajo más importante: evita errores de tipeo y te confirma que la ruta existe.
- **Flecha arriba / abajo**: navega el historial de comandos. Repetir el comando anterior corregido es el 50 % del trabajo real.
- **Ctrl+C**: cancela el comando en ejecución (un script colgado, una descarga eterna). No cierra la terminal.
- **Ctrl+L** o `clear` (`cls` en Windows): limpia la pantalla; no borra nada más.
- **Pegar**: en Windows Terminal y PowerShell, clic derecho o `Ctrl+V`. En muchas terminales Linux es `Ctrl+Shift+V`.
- `history` (bash) o `Get-History` (PowerShell): lista lo que has ejecutado en la sesión.

## Errores comunes

| Síntoma | Causa real | Solución |
|---|---|---|
| `'python' no se reconoce...` | El programa no está en el PATH o no está instalado | Instalar; verificar con `where.exe python`; reabrir la terminal |
| `No se encuentra la ruta de acceso` | Ruta relativa interpretada desde otra carpeta | `pwd` para ubicarte, `ls` para ver qué hay, corrige la ruta |
| El comando "no hace nada" | Escribiste el comando pero no presionaste Enter, o el programa espera entrada | Enter; si sigue colgado, `Ctrl+C` |
| Falla con archivos "Mis Documentos" | Espacios sin comillas parten el argumento en dos | Encierra la ruta entre comillas |
| Instalé algo y la terminal no lo ve | La sesión leyó el PATH al abrirse, antes de la instalación | Cierra y abre la terminal |
| Copiaste un comando con `$` o `>` inicial | Ese símbolo era el prompt del ejemplo, no parte del comando | Copia solo desde el nombre del programa |

## Nivel siguiente

Lo que sigue de forma natural, y que irás tocando durante el curso:

- **Scripts**: guardar varios comandos en un archivo (`.ps1` en PowerShell, `.sh` en bash) y ejecutarlos como uno solo. Es el paso de "ejecutar" a "automatizar".
- **git**: el control de versiones se maneja completo desde la terminal; lo usarás para tus perfiles y guías de implementación.
- **ssh**: abrir una terminal *dentro de un servidor remoto*. Así se administran los servidores FHIR reales.
- **Gestores de paquetes**: `winget` (Windows), `apt` (Linux), `brew` (macOS) instalan software desde la terminal, sin descargar instaladores a mano.
- Matices de PowerShell: a diferencia de bash, sus tuberías transportan **objetos** estructurados y no solo texto; por eso `Get-ChildItem | Measure-Object` entiende "elementos" y no líneas.

## Chuleta

| Quiero... | PowerShell | bash |
|---|---|---|
| Saber dónde estoy | `pwd` | `pwd` |
| Listar archivos | `ls` | `ls` |
| Entrar a una carpeta | `cd nombre` | `cd nombre` |
| Subir un nivel | `cd ..` | `cd ..` |
| Crear carpeta | `mkdir nombre` | `mkdir nombre` |
| Ver un archivo | `cat archivo` | `cat archivo` |
| Ver el PATH | `$env:Path` | `echo $PATH` |
| Ubicar un programa | `where.exe prog` | `which prog` |
| Código de salida | `$LASTEXITCODE` | `echo $?` |
| Guardar salida | `comando > archivo` | `comando > archivo` |
| Encadenar programas | `a \| b` | `a \| b` |
| Cancelar / autocompletar / repetir | `Ctrl+C` / Tab / flecha arriba | igual |

## Autoevaluacion

1. ¿Cuál es la diferencia entre terminal y shell?
2. En el comando `curl -H "Accept: application/fhir+json" https://hapi.fhir.org/baseR4/metadata`, identifica el programa, el flag y el argumento.
3. Estás en `C:\Users\ana` y escribes `cd fhir\lab`. ¿Es una ruta absoluta o relativa, y a qué carpeta llegas?
4. ¿Qué hace exactamente el shell cuando escribes `python` y presionas Enter, y por qué puede responder "no se reconoce"?
5. ¿Qué diferencia hay entre stdout y stderr, y qué significa un código de salida 0?
6. ¿Qué hace `curl -s URL | python -m json.tool` y qué papel juega el símbolo `|`?
7. Instalaste Python con la terminal abierta y sigue sin reconocerse. ¿Cuál es la causa más probable y el arreglo?
8. ¿Qué diferencia hay entre `>` y `>>` al redirigir salida?

### Respuestas

1. La terminal es la ventana que dibuja texto; el shell es el intérprete (PowerShell, bash) que lee y ejecuta los comandos dentro de ella.
2. Programa: `curl`. Flag: `-H "Accept: application/fhir+json"` (agrega un header). Argumento: la URL.
3. Relativa (no empieza en la raíz). Llegas a `C:\Users\ana\fhir\lab`.
4. Recorre en orden las carpetas listadas en la variable PATH buscando un ejecutable llamado `python`; si ninguna lo contiene, responde que no se reconoce.
5. stdout lleva los resultados normales y stderr los errores; son canales separados aunque se mezclen en pantalla. Código 0 = el programa terminó sin fallo.
6. Descarga el JSON del servidor FHIR y se lo pasa como entrada a Python, que lo imprime formateado. El `|` conecta la salida del primero con la entrada del segundo.
7. La sesión de terminal leyó el PATH al abrirse, antes de la instalación. Cierra y abre la terminal.
8. `>` crea o sobrescribe el archivo; `>>` agrega al final sin borrar lo existente.

## Para profundizar

- [Línea de comandos — curso intensivo (MDN)](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Command_line) — el mejor recorrido corto y neutral por la terminal, del proyecto Mozilla.
- [¿Qué es PowerShell? (Microsoft Learn, español)](https://learn.microsoft.com/es-es/powershell/scripting/overview) — la referencia oficial del shell que usarás a diario en Windows.
- [Guía de instalación del curso](/setup) — deja tu terminal, Python y herramientas listos con pasos verificados.
