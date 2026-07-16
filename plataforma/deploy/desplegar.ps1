# Despliega la plataforma a Google Cloud Run, referenciando los secretos POR NOMBRE
# (los valores viven en Secret Manager; este script no los ve).
#   cd plataforma
#   .\deploy\desplegar.ps1
#
# Requisitos: gcloud autenticado, y haber corrido antes deploy\crear-secretos.ps1.

param([string]$EnvFile = ".env.production")

if (-not (Test-Path $EnvFile)) { Write-Error "Falta $EnvFile"; exit 1 }

$map = @{}
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
    $v = $matches[2].Trim(); if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
    $map[$matches[1]] = $v
  }
}

$project = $map["GCP_PROJECT"]
$region  = if ($map["GCP_REGION"]) { $map["GCP_REGION"] } else { "us-central1" }
$service = if ($map["SERVICE_NAME"]) { $map["SERVICE_NAME"] } else { "rutafhir" }
$allow   = $map["AUTH_ALLOWLIST"]

gcloud config set project $project | Out-Null

Write-Host "1/4 Habilitando APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com | Out-Null

Write-Host "2/4 Dando acceso a los secretos a la cuenta de ejecucion de Cloud Run..."
$projNum = (gcloud projects describe $project --format="value(projectNumber)")
$runSa = "$projNum-compute@developer.gserviceaccount.com"
foreach ($s in @("DATABASE_URL", "AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "GEMINI_API_KEY")) {
  gcloud secrets add-iam-policy-binding $s --member="serviceAccount:$runSa" --role="roles/secretmanager.secretAccessor" 2>$null | Out-Null
}

Write-Host "3/4 Desplegando a Cloud Run (Cloud Build compila el Dockerfile)..."
$envVars = "AUTH_ALLOWLIST=$allow,NODE_ENV=production"
$secretsArg = "DATABASE_URL=DATABASE_URL:latest,AUTH_SECRET=AUTH_SECRET:latest,AUTH_GOOGLE_ID=AUTH_GOOGLE_ID:latest,AUTH_GOOGLE_SECRET=AUTH_GOOGLE_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest"

gcloud run deploy $service `
  --source . `
  --region $region `
  --allow-unauthenticated `
  --memory 1Gi `
  --cpu 1 `
  --min-instances 0 `
  --set-env-vars $envVars `
  --set-secrets $secretsArg

if ($LASTEXITCODE -ne 0) { Write-Error "Fallo el despliegue."; exit 1 }

$url = (gcloud run services describe $service --region $region --format="value(status.url)")
Write-Host "`n4/4 Desplegado en: $url"
Write-Host "Ahora fija AUTH_URL y confirma el redirect de Google:"
Write-Host "  gcloud run services update $service --region $region --set-env-vars AUTH_URL=$url,AUTH_ALLOWLIST=$allow,NODE_ENV=production --set-secrets $secretsArg"
Write-Host "  Google Console > Credenciales > tu OAuth client:"
Write-Host "    Origen JS autorizado:  $url"
Write-Host "    URI de redireccion:    $url/api/auth/callback/google"
