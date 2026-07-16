# Practica

## Objetivo

Escribir JSON válido de memoria, diagnosticar y corregir errores de sintaxis con un validador, y leer valores mediante rutas con índices sobre un recurso Patient de FHIR. Todo se resuelve en el navegador: usa el editor de esta plataforma o https://jsonlint.com.

## Ejercicios guiados

1. **Un objeto simple.** En el editor (o en jsonlint.com) escribe desde cero un objeto para la paciente ficticia Carmen Ramírez con exactamente estos campos: `"nombre"` (string), `"edad"` (number, 37), `"asegurada"` (boolean, true). Valida.
   **Resultado esperado:** el validador responde `Valid JSON`. Si marca error, revisa comillas dobles en claves y strings, y que `true` esté en minúsculas.

2. **Provoca el error a propósito.** Sobre tu JSON válido, agrega una coma después de `true` (coma final) y valida de nuevo.
   **Resultado esperado:** el validador rechaza el documento y señala la línea del cierre `}`. Lee el mensaje completo: acostúmbrate a que el error se reporta donde el parser se dio cuenta, no siempre donde está la coma. Quita la coma y verifica que vuelve a ser válido.

3. **Anidación.** Agrega a Carmen un campo `"contacto"` cuyo valor sea un objeto con `"telefono"` (string `"7012-3456"`) y `"correo"` (string). Valida.
   **Resultado esperado:** `Valid JSON`, con un objeto dentro del objeto. Comprueba visualmente que cada `{` tiene su `}`.

4. **Array de objetos.** Reemplaza `"contacto"` por `"contactos"`: un array con dos objetos, cada uno con `"nombre"` y `"telefono"`. Valida.
   **Resultado esperado:** `Valid JSON`. Pregunta de control antes de seguir: ¿qué ruta lleva al teléfono del segundo contacto? (Debe ser `contactos[1].telefono`.)

5. **Repara este JSON roto.** Copia el siguiente fragmento tal cual en el validador. Contiene **cuatro errores** distintos. Encuéntralos y corrígelos uno por uno, validando después de cada corrección:

   ```json
   {
     nombre: "Luis Hernández",
     'edad': 52,
     "diagnosticos": ["hipertensión", "diabetes tipo 2",],
     "activo": True
   }
   ```

   **Resultado esperado:** identificaste (a) clave `nombre` sin comillas, (b) comillas simples en `'edad'`, (c) coma final en el array, (d) `True` con mayúscula. Al final: `Valid JSON`.

6. **Rutas sobre un Patient FHIR.** Copia este recurso recortado y, **sin ejecutar nada**, escribe en papel o en un bloc de notas el valor de cada ruta pedida:

   ```json
   {
     "resourceType": "Patient",
     "id": "sv-0042",
     "name": [
       { "use": "official", "family": "Mejía Cruz", "given": ["Ana", "Sofía"] },
       { "use": "usual", "given": ["Anita"] }
     ],
     "birthDate": "1990-11-03",
     "telecom": [
       { "system": "phone", "value": "+503 7555-0101" },
       { "system": "email", "value": "ana.mejia@example.org" }
     ]
   }
   ```

   Rutas: `id`, `name[0].family`, `name[0].given[1]`, `name[1].given[0]`, `telecom[1].value`, `name[1].family`.
   **Resultado esperado:** `"sv-0042"`, `"Mejía Cruz"`, `"Sofía"`, `"Anita"`, `"ana.mejia@example.org"` y, para la última, "no existe": el segundo nombre no tiene campo `family`, y eso es normal en FHIR (campo ausente = no se registró).

## Retos

1. **Ficha completa.** Escribe de memoria (sin mirar la lección) un objeto de paciente ficticio con al menos un string, un number, un boolean, un array de strings y un objeto anidado. **Criterio de éxito:** jsonlint dice `Valid JSON` al primer o segundo intento.
2. **Los seis tipos.** Construye un único objeto JSON que contenga los seis tipos de valor, incluido un `null` explícito. **Criterio de éxito:** `Valid JSON` y puedes señalar dónde está cada tipo.
3. **Array de objetos anidado.** Modela dos medicamentos, cada uno con `"nombre"`, `"dosisMg"` (number) y `"horarios"` (array de strings). **Criterio de éxito:** `Valid JSON` y la ruta `medicamentos[1].horarios[0]` apunta al primer horario del segundo medicamento.
4. **Cazador de errores.** Toma tu JSON del reto 1, introduce tres errores de sintaxis distintos, espera 10 minutos y repáralo usando solo los mensajes del validador. **Criterio de éxito:** `Valid JSON` sin comparar con una copia guardada.
5. **FHIR real.** Abre en el navegador `https://hapi.fhir.org/baseR4/Patient?_count=1`, copia la respuesta a jsonlint y formatéala. Localiza dentro del resultado un array de objetos y escribe la ruta hasta un valor concreto que elijas. **Criterio de éxito:** la ruta que escribiste usa al menos un índice `[n]` y apunta al valor correcto.

## Reto Feynman

Explica por escrito, en 4-6 líneas cada uno y como si hablaras con un colega administrativo del hospital (cero jerga):

1. **Objeto vs array:** cuándo los datos van en "ficha con casillas etiquetadas" y cuándo en "fila ordenada", y por qué un expediente necesita ambos.
2. **null vs campo ausente:** por qué "no se anotó el teléfono" y "se anotó que no hay teléfono" son cosas distintas, y cuál de las dos usa FHIR al omitir campos.

Si al escribirlo necesitas términos de la lección que no sabes explicar, vuelve a esa sección: ahí está tu laguna.

## Criterio de completado

- [ ] Escribí un objeto JSON válido de memoria, con los seis tipos de valor, y jsonlint lo aceptó.
- [ ] Reparé el JSON roto del ejercicio 5 identificando los cuatro errores sin ayuda externa.
- [ ] Resolví las seis rutas del Patient del ejercicio 6 sin errores (incluida la que "no existe").
- [ ] Completé al menos 4 de los 5 retos con su criterio de éxito cumplido.
- [ ] Escribí las dos explicaciones Feynman y las entiendo sin releerlas.
