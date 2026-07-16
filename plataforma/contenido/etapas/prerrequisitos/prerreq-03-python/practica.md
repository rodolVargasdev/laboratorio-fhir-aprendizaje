# Practica

## Objetivo

Escribir, ejecutar y depurar scripts de Python que manipulan datos de pacientes ficticios y consultan un servidor FHIR real. Al terminar habrás creado un entorno virtual, instalado `requests` y extraído nombres de pacientes desde HAPI FHIR con tu propio código.

## Ejercicios guiados

Trabaja en una carpeta nueva, por ejemplo `C:\fhir-practica`. Si Python no está instalado, resuélvelo primero en [Setup](/setup).

1. **Verificar Python.** En la terminal ejecuta `python --version`.
   Resultado esperado: una línea como `Python 3.12.4` (cualquier 3.10 o superior sirve). Si aparece un error de comando no encontrado, vuelve a [Setup](/setup).

2. **Primer script.** Crea `hola.py` con este contenido y ejecútalo con `python hola.py`:

   ```python
   institucion = "Sistema Nacional de Salud"
   anio = 2026
   print("Integrando datos para:", institucion)
   print("Anio de arranque:", anio)
   ```

   Resultado esperado: dos líneas impresas con el texto y el número. Si ves `SyntaxError`, revisa comillas y paréntesis.

3. **Diccionario de paciente.** Crea `paciente.py`:

   ```python
   paciente = {
       "id": "sv-100",
       "nombre": "Marta Rivas",
       "genero": "female",
       "edad": 52
   }
   print(paciente["nombre"])
   print(paciente.get("telefono", "sin dato"))
   ```

   Resultado esperado: `Marta Rivas` y luego `sin dato`. Ahora cambia la segunda línea por `print(paciente["telefono"])` y ejecuta de nuevo: debes obtener `KeyError: 'telefono'`. Lee el traceback de abajo hacia arriba y luego restaura el `.get()`.

4. **Recorrer con for e if.** Crea `cola.py`:

   ```python
   cola = [
       {"nombre": "Marta Rivas", "edad": 52},
       {"nombre": "Hugo Serrano", "edad": 17},
       {"nombre": "Elsa Portillo", "edad": 71},
   ]
   for p in cola:
       if p["edad"] >= 60:
           print(p["nombre"], "- prioridad alta")
       else:
           print(p["nombre"], "- prioridad normal")
   ```

   Resultado esperado: Marta y Hugo con prioridad normal, Elsa con prioridad alta. Quita la indentación del `if` a propósito, ejecuta, observa el `IndentationError` y corrígelo.

5. **json.loads y ruta anidada.** Crea `desde_json.py`:

   ```python
   import json
   texto = '{"resourceType": "Patient", "name": [{"family": "Rivas", "given": ["Marta"]}]}'
   recurso = json.loads(texto)
   print(recurso["name"][0]["given"][0], recurso["name"][0]["family"])
   ```

   Resultado esperado: `Marta Rivas`. Si sale `json.decoder.JSONDecodeError`, hay una comilla o coma mal puesta dentro del string.

6. **Entorno virtual e instalación.** En la carpeta del proyecto:

   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install requests
   ```

   Resultado esperado: el prompt cambia a `(.venv) PS C:\fhir-practica>` y pip termina con `Successfully installed ... requests-...`. Verifica con `pip show requests` (debe mostrar nombre y versión).

7. **Script final contra HAPI FHIR.** Con el entorno activo, crea `pacientes.py` con el script completo de la lección (GET a `https://hapi.fhir.org/baseR4/Patient?_count=3`, verificación de `status_code`, `.json()`, recorrido de `entry` con `.get()`), y ejecútalo con `python pacientes.py`.
   Resultado esperado: `Pacientes recibidos: 3` seguido de tres líneas con nombres (o `(paciente sin nombre registrado)` si algún recurso viene incompleto; es un servidor de pruebas y eso es normal).

## En la PC

Comandos exactos usados en esta práctica. La instalación de Python en sí está en [Setup](/setup).

```powershell
# PowerShell (Windows)
python --version
python hola.py
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install requests
pip show requests
python pacientes.py
```

```bash
# bash (Linux / macOS): solo cambian estos tres
python3 --version
python3 -m venv .venv
source .venv/bin/activate
```

Salida esperada al activar el entorno e instalar:

```text
(.venv) PS C:\fhir-practica> pip install requests
Collecting requests
  ...
Successfully installed certifi-... charset_normalizer-... idna-... requests-2.32.x urllib3-...
```

Si PowerShell bloquea la activación con un error de políticas de ejecución, corre una sola vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, cierra y reabre la terminal.

## Retos

1. **Género con respaldo.** Modifica `pacientes.py` para que imprima también el género de cada paciente usando `paciente.get("gender", "sin dato")`. Criterio de éxito: cada línea muestra nombre y género, y ningún paciente sin género rompe el script.
2. **Contador selectivo.** Agrega un contador que al final imprima cuántos de los pacientes recibidos tienen `birthDate` registrado. Criterio de éxito: `Con fecha de nacimiento: N de 3` con el número correcto.
3. **Función reutilizable.** Extrae la lógica de nombre a una función `def nombre_completo(paciente):` que devuelva el nombre o `"(sin nombre)"`, y úsala dentro del `for`. Criterio de éxito: la salida no cambia y la función existe con `return`.
4. **Más pacientes.** Cambia `_count=3` por `_count=10` y ajusta lo necesario. Criterio de éxito: `Pacientes recibidos: 10` y diez líneas de salida.
5. **Guardar evidencia.** Al final del script, guarda el Bundle completo en `bundle.json` con `json.dump(bundle, f, indent=2)`. Criterio de éxito: el archivo existe, se abre en el editor y empieza con `{` y `"resourceType": "Bundle"`.
6. **Diagnóstico inverso.** Desactiva el entorno con `deactivate` y ejecuta `python pacientes.py`. Criterio de éxito: explicas en una frase por qué aparece `ModuleNotFoundError` y lo resuelves reactivando el entorno.

## Reto Feynman

Explica por escrito, en 4 a 6 líneas cada uno y sin tecnicismos, a un colega no técnico de tu institución:

1. Qué es un diccionario de Python y por qué se parece a una ficha clínica.
2. Qué hace la librería `requests` cuando el script "le pide pacientes" a un servidor.

Prueba de calidad: que un administrativo pueda leerlo y explicártelo de vuelta sin errores.

## Criterio de completado

- [ ] `python --version` responde con Python 3.10 o superior.
- [ ] Los scripts de los ejercicios 2 a 5 corren sin errores y produje (y corregí) un `KeyError` y un `IndentationError` a propósito.
- [ ] Existe `.venv`, se activa y `pip show requests` muestra la librería instalada.
- [ ] `pacientes.py` imprime los nombres de 3 pacientes reales de HAPI FHIR.
- [ ] Completé al menos los retos 1, 2 y 3.
- [ ] Escribí las dos explicaciones del Reto Feynman.
