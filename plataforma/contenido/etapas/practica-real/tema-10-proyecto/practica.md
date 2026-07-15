> **Como practicar este tema:** varios ejercicios puedes hacerlos en el navegador desde el [Laboratorio](/laboratorio). Los que piden tu PC usan los scripts en `legacy/dias/`; prepara tu entorno una sola vez con la [guia de setup](/setup).

# Dia 13: Mini-proyecto integrador (resumen clinico)

Objetivo: unir todo lo aprendido en un pequeno programa util: crear datos de un
paciente y generar un resumen clinico legible leyendo desde el servidor FHIR.
Tiempo: 2-3 horas. Costo objetivo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion breve.
3. Practica (el proyecto).
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 13`.

## Que vas a construir

Un script que:
1. Crea un paciente ficticio (Patient).
2. Le agrega varias observaciones (Observation) y una condicion (Condition),
   enlazadas por referencia.
3. Lee de vuelta del servidor y arma un "resumen clinico" legible.

Esto integra: JSON, REST/CRUD, referencias, terminologias y el modelo FHIR.

## Practica

```powershell
# Elige servidor (opcional). Por defecto usa el publico de pruebas.
# Local:  $env:FHIR_BASE_URL = "http://localhost:8080/fhir"
python legacy\dias\dia-13\practica\resumen_clinico.py
```

Reto: agrega al resumen el calculo de la edad del paciente a partir de birthDate.

## Limpieza (si usaste la via nube GCP)

Para no gastar credito, borra el dataset al terminar tus practicas en la nube:

```powershell
gcloud healthcare datasets delete integracion-nacional-dataset --location=us-central1
```

Ver mas detalle en `legacy\dias\dia-14\practica\limpieza-gcp.md`.

## Reto Feynman

En `PROGRESO.md`, explica que partes del dia 1 al 12 usaste en este mini-proyecto
y por que cada una fue necesaria.

---

# Dia 14: Cierre, autoevaluacion final y plan de continuacion

Objetivo: medir objetivamente lo aprendido en las 2 semanas, limpiar recursos de
la nube (si los usaste) y definir tu camino del resto del anio hacia la
certificacion.
Tiempo: 2-3 horas. Costo objetivo: $0.

## Rutina de cierre

1. Repaso espaciado y estado:

   ```powershell
   python evaluacion\repaso.py
   python evaluacion\repaso.py --estado
   ```

2. Examen final acumulado (mezcla de todo):

   ```powershell
   python evaluacion\quiz_runner.py --repaso --n 20
   python evaluacion\quiz_runner.py --dia 14
   ```

3. Revisa tu historial de resultados:

   ```powershell
   python -c "print(open('evaluacion/resultados/historial.csv', encoding='utf-8').read())"
   ```

4. Limpieza de la nube (si usaste GCP): sigue `practica/limpieza-gcp.md`.

## Criterio objetivo de exito de las 2 semanas

- Examen final (dia 14) >= 80%.
- La mayoria de tus tarjetas de Leitner en cajas 3-5.
- Los 7 puntos del checklist del dia 7 + estos: terminologias, modelo FHIR,
  Bundle, y un mini-proyecto funcionando.

Si cumples esto, tienes los CIMIENTOS listos. El estandar FHIR a profundidad y el
examen oficial son la siguiente etapa (ver `guias/PLAN-RESTO-DEL-ANIO.md`).

## Que sigue

Abre `guias/PLAN-RESTO-DEL-ANIO.md`: es tu hoja de ruta de varios meses para acumular
la experiencia practica que HL7 recomienda antes del examen Foundational
Implementer, con micro-aprendizaje para los dias ocupados (`guias/MICRO-APRENDIZAJE.md`).

## Reto Feynman final

En `PROGRESO.md`, escribe una "clase" de 10 lineas que le darias a un companero
nuevo de la integración nacional para explicarle que es FHIR, como se consulta y por que importa.
Si puedes explicarlo claro, lo dominas.