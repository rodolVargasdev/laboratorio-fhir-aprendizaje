# App del laboratorio (celular + PC) — costo $0

`index.html` es una app estática sin dependencias: ruta de estudio con progreso,
lecturas de los temas, quizzes interactivos y tarjetas Leitner. Todo el estado se
guarda en el navegador (localStorage). No hay servidor, no hay costo.

## Publicarla gratis con GitHub Pages (una sola vez)

1. Sube el repo a GitHub (ya lo tienes: `rodolVargasdev/laboratorio-fhir-aprendizaje`).
2. En GitHub: **Settings → Pages → Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: `master`, carpeta `/docs` → **Save**
3. En 1-2 minutos tu app queda en:
   `https://rodolvargasdev.github.io/laboratorio-fhir-aprendizaje/`
4. En el celular: abre esa URL en Chrome → menú ⋮ → **Añadir a pantalla de inicio**.
   Queda como una app más del teléfono.

## Regenerar los datos de la app

La app lee `datos.js`, que se genera desde los quizzes, lecturas móviles y
`evaluacion/temas.json`. Cuando cambies cualquiera de esos archivos:

```powershell
python docs\generar_datos.py
```

y haz commit + push para que GitHub Pages se actualice.

## Probarla en la PC sin publicar

```powershell
python -m http.server 8080 --directory docs
```

y abre http://localhost:8080 (o simplemente abre `docs/index.html` con doble clic).

## Importante

- El progreso de la app vive en cada dispositivo (localStorage): el celular y la
  PC no se sincronizan entre sí.
- La evidencia formal para `preparacion.py` (semáforo de examen) sigue saliendo
  de `quiz_runner.py` en la terminal. La app es para estudiar en todo momento;
  la terminal, para registrar simulacros oficiales.
