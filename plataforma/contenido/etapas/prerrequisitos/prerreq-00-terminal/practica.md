# Practica

## Objetivo

Moverte por tu computadora desde la terminal con soltura: ubicarte, navegar, crear una carpeta de trabajo para el curso, diagnosticar el PATH y leer un error real sin pánico. Si aún no tienes la terminal lista, primero pasa por [Setup](/setup).

## Ejercicios guiados

1. **Abre la terminal y ubícate.** Abre PowerShell (Windows) o Terminal (macOS/Linux) y escribe:

   ```powershell
   pwd
   ```

   **Resultado esperado:** una ruta como `C:\Users\tu-usuario` (o `/home/tu-usuario`). Esa es tu carpeta de inicio y tu directorio de trabajo actual.

2. **Mira qué hay donde estás.**

   ```powershell
   ls
   ```

   **Resultado esperado:** la lista de carpetas conocidas (Documents, Downloads, Desktop...). Es lo mismo que ves en el explorador de archivos, sin dibujos.

3. **Crea tu carpeta de trabajo del curso y entra en ella.**

   ```powershell
   mkdir fhir-lab
   cd fhir-lab
   pwd
   ```

   **Resultado esperado:** `pwd` ahora termina en `\fhir-lab`. Acabas de crear y ocupar la carpeta donde vivirán todas las prácticas.

4. **Navega con rutas relativas.**

   ```powershell
   cd ..
   pwd
   cd fhir-lab
   ```

   **Resultado esperado:** tras `cd ..` vuelves a tu carpeta de usuario; tras `cd fhir-lab` regresas. Nota que no escribiste la ruta completa: fue relativa a donde estabas.

5. **Provoca un error a propósito y léelo.**

   ```powershell
   cd carpeta-inexistente
   ```

   **Resultado esperado:** un mensaje del tipo "No se encuentra la ruta de acceso... carpeta-inexistente". Léelo con el método de la lección: ¿qué comando falló?, ¿qué nombre tuyo menciona?, ¿cuál es la causa? Nada se rompió.

6. **Diagnostica tu PATH.**

   ```powershell
   where.exe python
   ```

   (en bash: `which python3`). **Resultado esperado:** una ruta como `C:\Users\tu-usuario\AppData\Local\Programs\Python\Python312\python.exe`, o un mensaje de que no lo encontró. Ambos resultados son información útil: ya sabes si Python está visible para el shell. Si no aparece, la guía [Setup](/setup) lo resuelve.

7. **Usa el autocompletado y el historial.** Escribe `cd fh` y presiona **Tab**: el shell completa `fhir-lab`. Presiona **flecha arriba** varias veces: reaparecen tus comandos anteriores. **Resultado esperado:** confirmas que casi nunca tendrás que teclear rutas completas ni repetir comandos a mano.

8. **Guarda una salida en un archivo y compruébalo.**

   ```powershell
   ls > listado.txt
   cat listado.txt
   ```

   **Resultado esperado:** `cat` muestra el mismo listado que viste en pantalla, ahora guardado en `listado.txt`. Acabas de usar redirección.

## En la PC

Todo lo anterior es en tu PC. Comprueba además tu versión de shell (te lo pedirá más de una guía de instalación):

```powershell
$PSVersionTable.PSVersion
```

**Salida esperada:** una tabla con Major 5 o 7. En bash: `bash --version` muestra la versión en la primera línea. Si algo no coincide, revisa [Setup](/setup).

## Retos

1. **Árbol de carpetas.** Desde `fhir-lab`, crea la estructura `practicas/json` y `practicas/http` usando solo la terminal. Éxito: `ls practicas` muestra las dos subcarpetas.
2. **Ida y vuelta absoluta.** Ve a `C:\` (o `/` en Linux) con una ruta absoluta y regresa a `fhir-lab` también con ruta absoluta. Éxito: `pwd` termina en `fhir-lab` sin haber usado `cd ..`.
3. **Detective del PATH.** Muestra tu PATH completo (`$env:Path` o `echo $PATH`) e identifica en qué carpeta está el shell que usas. Éxito: puedes señalar la carpeta y verificarla con `where.exe powershell` (o `which bash`).
4. **Contador por tubería.** Cuenta cuántos elementos hay en tu carpeta de usuario usando un pipe: `ls | Measure-Object` (o `ls | wc -l`). Éxito: obtienes un número y puedes explicar qué hizo cada lado del `|`.
5. **Bitácora acumulada.** Ejecuta tres veces `pwd >> bitacora.txt` desde carpetas distintas y muestra el archivo. Éxito: `cat bitacora.txt` lista las tres rutas, en orden.
6. **Autopsia de un error.** Ejecuta `python archivo-que-no-existe.py` y escribe en dos líneas: qué programa falló y qué te dijo exactamente. Éxito: tu explicación menciona la causa concreta, no "salió un error".

## Reto Feynman

Explícale a un colega de área médica, en 4-6 líneas y sin tecnicismos: (1) qué es la terminal y por qué los informáticos la prefieren para tareas serias, y (2) qué es el PATH y por qué a veces "la computadora no encuentra" un programa recién instalado. Si tu explicación necesita las palabras "shell" o "variable de entorno", todavía no está lista.

## Criterio de completado

- [ ] Abro la terminal y sé en qué carpeta estoy con `pwd`.
- [ ] Navego con `cd`, `cd ..` y rutas relativas sin copiar de la guía.
- [ ] Creé la carpeta `fhir-lab` y su subestructura desde la terminal.
- [ ] Puedo explicar qué es el PATH y diagnosticar "no se reconoce" con `where.exe`/`which`.
- [ ] Usé un pipe (`|`) y una redirección (`>` o `>>`) y sé qué hizo cada uno.
- [ ] Leí un mensaje de error completo e identifiqué su causa sin ayuda.
- [ ] Uso Tab y flecha arriba por reflejo.
