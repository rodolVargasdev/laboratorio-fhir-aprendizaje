# Practica

## Objetivo

Ejecutar contra un servidor real todas las piezas del lenguaje de búsqueda: tokens con sistema, prefijos de fecha, chaining, `_has`, composites, `_include`/`_revinclude` y paginación siguiendo `link.next`; y aprender a auditar el `self` link para detectar parámetros ignorados.

## En el navegador (Laboratorio)

Todos contra `https://hapi.fhir.org/baseR4`; escribe solo el path.

1. **Token en sus cuatro formas.** Consulta:
   `Observation?code=http://loinc.org|8867-4&_count=3`
   Observa `Bundle.total` (si viene) y el `self` link. Repite sin sistema (`code=8867-4`) y compara resultados: sin sistema puede matchear el mismo código en otros catálogos. Respuesta esperada: searchset; con `system|code` el conjunto es igual o más pequeño.

2. **Prefijos de fecha como rangos.** Consulta:
   `Patient?birthdate=ge1990-01-01&birthdate=le1999-12-31&_count=5`
   Verifica que todos los `birthDate` caen en la década. Luego prueba `Patient?birthdate=1995&_count=5`: sin prefijo equivale a `eq`, y `1995` es el rango del año completo. Respuesta esperada: nacimientos de cualquier fecha de 1995.

3. **String vs :exact.** Consulta:
   `Patient?family=gar&_count=5` y después `Patient?family:exact=Garcia&_count=5`
   Observa que la primera trae García, Garza, Garay... (empieza-por, insensible) y la segunda solo la forma exacta. Respuesta esperada: conjuntos distintos; el segundo puede ser vacío si nadie se llama exactamente "Garcia".

4. **Chaining.** Consulta:
   `Observation?subject:Patient.name=smith&_count=5`
   Respuesta esperada: Observations cuyos pacientes tienen nombre que empieza por smith. Abre un `subject.reference` y verifica el nombre a mano: acabas de comprobar un chain.

5. **Reverse chaining.** Consulta:
   `Patient?_has:Observation:patient:code=8867-4&_count=5`
   Respuesta esperada: solo pacientes que tienen al menos una Observation de frecuencia cardíaca. Compara con el ejercicio 1: es la misma relación mirada desde el otro extremo.

6. **_include y search.mode.** Consulta:
   `Observation?code=8867-4&_include=Observation:subject&_count=3`
   Respuesta esperada: más entries que matches; las Observations con `search.mode: match` y los Patients con `search.mode: include`.

7. **_revinclude.** Toma un id de paciente del ejercicio anterior y consulta:
   `Patient?_id={id}&_revinclude=Observation:patient`
   Respuesta esperada: el paciente (match) más todas sus Observations (include) en un solo viaje.

8. **Composite.** Consulta:
   `Observation?component-code-value-quantity=http://loinc.org|8480-6$gt140&_count=3`
   Respuesta esperada: Observations donde el MISMO component (sistólica 8480-6) supera 140. Verifica en el JSON que el valor >140 está en el componente correcto.

9. **Paginación opaca.** Consulta:
   `Observation?_count=5`
   Copia la URL del `link` con `relation: next` y pégala (recorta la base) como siguiente consulta. Respuesta esperada: la página 2; observa que la URL next no se parece a tu búsqueda original — por eso no se construye a mano.

10. **Auditar el self link.** Consulta:
    `Patient?parametro-inventado=x&_count=2`
    Respuesta esperada: 200 con resultados (manejo lenient) y un `self` link SIN tu parámetro: el servidor lo ignoró. Esta es la prueba de por qué existe `Prefer: handling=strict`.

## En la PC

Requiere [Setup](/setup).

**Recolector que sigue next.**

```python
import requests
url = "https://hapi.fhir.org/baseR4/Observation"
params = {"code": "http://loinc.org|8867-4", "_count": 20}
total = 0
while url and total < 100:
    b = requests.get(url, params=params).json()
    params = None  # solo la primera vez; next ya trae todo
    total += sum(1 for e in b.get("entry", []) if e.get("search", {}).get("mode") == "match")
    url = next((l["url"] for l in b.get("link", []) if l["relation"] == "next"), None)
print("matches recolectados:", total)
```

Salida esperada: un número que crece de 20 en 20 hasta cortar en 100. Nota el detalle: tras la primera página, los parámetros viven dentro de la URL `next`.

**Strict handling con curl:**

```bash
curl -s -H "Prefer: handling=strict" \
  "https://hapi.fhir.org/baseR4/Patient?parametro-inventado=x"
```

Salida esperada: un OperationOutcome de error (o un 400) en lugar de resultados silenciosos, si el servidor honra el header.

## Retos

1. Construye la búsqueda "pacientes nacidos antes de 1960 sin género registrado". Éxito: usa `le`/`lt` y `:missing=true` y devuelve solo recursos que cumplen ambas.
2. "Observations de presión arterial (85354-9) de un paciente concreto, incluyendo su Encounter". Éxito: entries match + include del tipo Encounter.
3. Encuentra pacientes con alguna Condition cuyo texto de código contenga "diabetes" usando `_has` y `:text`. Éxito: cada paciente devuelto tiene tal Condition (verifícalo con un `_revinclude`).
4. Escribe una búsqueda con `_sort=-_lastUpdated&_elements=name,birthdate` y comprueba el tag SUBSETTED en `meta`. Éxito: recursos recortados y ordenados de más reciente a más antiguo.
5. Usa `_summary=count` para contar todas las Observations LOINC 8867-4 sin traer ninguna. Éxito: Bundle sin entries y con `total`.
6. Reproduce un falso positivo: encuentra (o construye con POST) una Observation multicomponente donde `component-code=X&component-value-quantity=Y` matchea pero el composite no. Éxito: puedes explicar la diferencia con el JSON delante.

## Reto Feynman

Explícale a un desarrollador junior, sin abrir la especificación, por qué `birthdate=eq2020` devuelve pacientes nacidos el 15 de marzo de 2020, y por qué la URL de la página siguiente "no se parece en nada" a la búsqueda que él escribió. Dos ideas: precisión-como-rango y paginación opaca.

## Criterio de completado

- [ ] Ejecuté los 10 ejercicios del Laboratorio y entiendo cada respuesta.
- [ ] Sé escribir de memoria las 4 formas de un token y cuándo usar `system|code`.
- [ ] Puedo explicar eq/gt/sa sobre fechas con el modelo de rangos.
- [ ] Escribí un chain tipado y un `_has` sin copiar la sintaxis.
- [ ] Mi script sigue `link.next` sin construir URLs a mano.
- [ ] Comprobé el manejo lenient y sé cuándo exigir `Prefer: handling=strict`.
- [ ] Completé al menos 4 de los 6 retos.
