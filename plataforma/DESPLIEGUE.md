# Despliegue a produccion (Cloud Run + Neon) — paso a paso

Regla de oro de seguridad: **los secretos nunca se pegan en el chat ni se suben a git.**
Tu los generas y los cargas en Google Secret Manager desde tu terminal; el despliegue
los referencia por nombre.

Orden recomendado: A (generar) -> B (cargar secretos) -> C (base de datos) -> D (desplegar)
-> E (conectar Google) -> F (probar).

---

## A. Generar las credenciales

### A1. Base de datos Neon (gratis)
1. Entra a https://neon.tech e inicia sesion (puede ser con Google).
2. **Create project** -> nombre `rutafhir`, region la mas cercana (p. ej. AWS us-east).
3. En el panel del proyecto, **Connection string** -> elige la opcion **Pooled connection**
   (la que incluye `-pooler` en el host). Copiala completa; se ve asi:
   `postgresql://usuario:password@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Guardala; es tu `DATABASE_URL`.

### A2. Proyecto de Google Cloud
1. https://console.cloud.google.com -> crea un proyecto (anota el **ID del proyecto**).
2. Asegurate de tener **facturacion** habilitada (Cloud Run tiene capa gratuita; escala a
   cero, pero GCP exige una tarjeta para la cuenta). No genera costo en reposo.

### A3. Credenciales OAuth de Google (para el login)
1. En el proyecto: **APIs y servicios > Pantalla de consentimiento de OAuth**.
   - Tipo **Externo** -> crea.
   - En "Usuarios de prueba" agrega los correos que usaran la app (los ~5).
2. **APIs y servicios > Credenciales > Crear credenciales > ID de cliente de OAuth**.
   - Tipo: **Aplicacion web**. Nombre: `rutafhir-web`.
   - Los **origenes** y **redirect** los completaras en el paso E (necesitas la URL de
     Cloud Run, que sale al desplegar). Por ahora crea el cliente.
3. Copia el **ID de cliente** (`...apps.googleusercontent.com`) y el **secreto**
   (`GOCSPX-...`). Son `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`.

### A4. Clave de Gemini (tutor IA)
1. https://aistudio.google.com -> **Get API key** -> crea una clave. Es `GEMINI_API_KEY`.
   (Opcional: sin ella el tutor funciona en "modo desarrollo".)

### A5. Secreto de Auth.js
En tu terminal, dentro de `plataforma`:
```powershell
npx auth secret
```
Copia el valor generado; es `AUTH_SECRET`. (No lo pegues en el chat.)

---

## B. Cargar los secretos en Secret Manager (en TU terminal)

1. Autentica gcloud una vez:
   ```powershell
   gcloud auth login
   ```
2. Copia la plantilla y rellena tus valores REALES (este archivo queda solo en tu maquina):
   ```powershell
   cd C:\Users\JOSE-\applications_local_env\aprendizaje\plataforma
   copy .env.production.example .env.production
   notepad .env.production
   ```
   Rellena `GCP_PROJECT`, `GCP_REGION`, `DATABASE_URL`, `AUTH_SECRET`,
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `GEMINI_API_KEY`, `AUTH_ALLOWLIST`.
3. Carga los secretos (el script los mete en Secret Manager sin mostrarlos):
   ```powershell
   .\deploy\crear-secretos.ps1
   ```

---

## C. Preparar la base de datos Neon (esquema + contenido)

Una sola vez, con la `DATABASE_URL` de Neon en tu shell (no en el chat):
```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje\plataforma
$env:DATABASE_URL = (Get-Content .env.production | Select-String '^DATABASE_URL=').ToString().Split('=',2)[1].Trim('"')
npx prisma migrate deploy      # crea las tablas en Neon
npm run db:seed                # carga los 17 temas / 260 preguntas / 228 tarjetas
```

---

## D. Desplegar a Cloud Run

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje\plataforma
.\deploy\desplegar.ps1
```
El script habilita APIs, da permiso de lectura de secretos a Cloud Run, compila el
Dockerfile con Cloud Build y publica el servicio. Al terminar imprime la **URL**.

---

## E. Conectar Google OAuth (con la URL ya conocida)

1. Copia la URL que imprimio el paso D (p. ej. `https://rutafhir-xxxx.a.run.app`).
2. En **Google Console > Credenciales > tu cliente OAuth `rutafhir-web`**:
   - **Origenes de JavaScript autorizados:** la URL (sin barra final).
   - **URIs de redireccion autorizados:** `LA_URL/api/auth/callback/google`.
   - Guarda (tarda 1-2 min en propagar).
3. Fija `AUTH_URL` en el servicio (usa el comando que imprimio el paso D), por ejemplo:
   ```powershell
   gcloud run services update rutafhir --region us-central1 `
     --update-env-vars AUTH_URL=https://TU_URL.a.run.app
   ```

---

## F. Probar

1. Abre la URL. Debe redirigir a `/login`.
2. **Continuar con Google** con un correo de la allowlist -> deberia entrar al panel.
3. Abre un tema, prueba el quiz y el tutor (ahora con respuestas reales de Gemini).

Si el login falla con `redirect_uri_mismatch`: revisa que el URI de redireccion en Google
sea EXACTAMENTE `LA_URL/api/auth/callback/google` (sin barra final, https).

---

## Costos y mantenimiento
- **Cloud Run** escala a cero: sin trafico, sin costo de computo.
- **Neon** capa gratuita: vigila almacenamiento/computo (sobra para ~5 usuarios).
- **Gemini** capa gratuita: la app limita el uso por usuario/hora.
- Actualizar el contenido: edita `contenido/`, corre `npm run db:seed` contra Neon.
- Redesplegar tras cambios de codigo: repite el paso D.
