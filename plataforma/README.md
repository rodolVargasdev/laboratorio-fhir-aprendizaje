# RutaFHIR — plataforma de aprendizaje adaptativo

Aplicacion full-stack para aprender HL7 FHIR paso a paso: lecturas en el celular,
practica en la PC, tutor con IA integrado, quizzes con maestria y repaso espaciado.

Stack: **Next.js 16** (App Router, TypeScript) · **Tailwind v4** · **Prisma 7 + Postgres**
(local en Docker, **Neon** en produccion) · **Auth.js** (login con Google) · **Gemini**
(tutor IA) · despliegue en **Google Cloud Run**. Tipografia **Inter**; paleta azul/navy.

## Requisitos

- Node.js 20.9+ (probado con 22)
- Docker (para la base de datos local)

## Desarrollo local (paso a paso)

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env          # ya trae valores para local; genera un AUTH_SECRET propio si quieres

# 3. Base de datos local (Postgres en Docker, puerto 5433)
docker compose up -d

# 4. Crear el esquema
npm run db:migrate

# 5. Arrancar
npm run dev                   # http://localhost:3000
```

En local puedes entrar con el **acceso de desarrollo** (correo, sin Google): esta activo
solo si `AUTH_ENABLE_DEV_LOGIN="true"` y nunca existe en produccion.

### Scripts utiles

| Script | Que hace |
|--------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion (standalone) |
| `npm run db:migrate` | Crea/actualiza el esquema (migraciones) |
| `npm run db:studio` | Explora la base de datos (Prisma Studio) |
| `npm run db:seed` | Carga el contenido a la base (Fase 2+) |

## Variables de entorno

Ver `.env.example`. Las que debes proveer para produccion:

- `DATABASE_URL` — cadena *pooled* de Neon (incluye `sslmode=require`).
- `AUTH_SECRET` — `npx auth secret` o `openssl rand -base64 32`.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — credenciales OAuth de Google.
- `AUTH_ALLOWLIST` — correos autorizados, separados por coma.
- `AUTH_URL` — URL publica del servicio (Cloud Run).
- `GEMINI_API_KEY` — clave de Google AI Studio (tutor, Fase 6).

### Como obtener las credenciales de Google (login)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs y servicios → Credenciales.
2. Crear **ID de cliente OAuth** tipo *Aplicacion web*.
3. Origenes autorizados: `http://localhost:3000` y la URL de Cloud Run.
4. URI de redireccion: `<origen>/api/auth/callback/google`.
5. Copiar el ID y el secreto a `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

### Base de datos en Neon (produccion)

1. Crear proyecto en [neon.tech](https://neon.tech) (free tier).
2. Copiar la cadena *pooled* a `DATABASE_URL`.
3. Aplicar el esquema: `npm run db:migrate` (o `prisma migrate deploy` en CI).

## Despliegue en Cloud Run

```bash
# Requiere gcloud autenticado y un proyecto GCP.
gcloud run deploy rutafhir \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "AUTH_URL=https://TU_SERVICIO.a.run.app" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,AUTH_SECRET=AUTH_SECRET:latest,AUTH_GOOGLE_ID=AUTH_GOOGLE_ID:latest,AUTH_GOOGLE_SECRET=AUTH_GOOGLE_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,AUTH_ALLOWLIST=AUTH_ALLOWLIST:latest"
```

Cloud Run escala a cero (costo $0 en reposo). Guarda los secretos en **Secret Manager**,
nunca en el codigo. La imagen usa el `Dockerfile` (Next.js standalone).

> Nota: el primer despliegue lo realiza el equipo con su proyecto GCP, base Neon y
> credenciales de Google. La app ya esta lista para desplegarse (Dockerfile + salida
> standalone verificados con el build de produccion).
