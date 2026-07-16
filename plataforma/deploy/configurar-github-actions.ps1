# Configura Workload Identity Federation para que GitHub Actions despliegue a Cloud Run
# SIN llaves JSON. Lo corres TU una sola vez, autenticado con gcloud.
#   cd plataforma
#   .\deploy\configurar-github-actions.ps1 -Repo "rodolVargasdev/laboratorio-fhir-aprendizaje"
#
# Al terminar imprime los valores que debes pegar como Variables del repo en GitHub
# (Settings > Secrets and variables > Actions > Variables).

param(
  [Parameter(Mandatory = $true)][string]$Repo,     # "owner/repositorio"
  [string]$EnvFile = ".env.production"
)

if (-not (Test-Path $EnvFile)) { Write-Error "Falta $EnvFile (con GCP_PROJECT, GCP_REGION, SERVICE_NAME, AUTH_ALLOWLIST)"; exit 1 }
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

gcloud config set project $project | Out-Null
$projNum = (gcloud projects describe $project --format="value(projectNumber)")

Write-Host "Habilitando APIs necesarias..."
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com | Out-Null

$sa = "gh-deployer"
$saEmail = "$sa@$project.iam.gserviceaccount.com"
Write-Host "Creando cuenta de servicio de despliegue ($saEmail)..."
gcloud iam service-accounts create $sa --display-name="GitHub Actions deployer" 2>$null | Out-Null

# Permisos minimos para desplegar y leer secretos
foreach ($role in @("roles/run.admin", "roles/cloudbuild.builds.editor", "roles/artifactregistry.admin", "roles/iam.serviceAccountUser", "roles/secretmanager.secretAccessor", "roles/storage.admin")) {
  gcloud projects add-iam-policy-binding $project --member="serviceAccount:$saEmail" --role=$role 2>$null | Out-Null
}

Write-Host "Creando Workload Identity Pool y proveedor de GitHub..."
gcloud iam workload-identity-pools create "github-pool" --location="global" --display-name="GitHub Actions" 2>$null | Out-Null
gcloud iam workload-identity-pools providers create-oidc "github-provider" `
  --location="global" --workload-identity-pool="github-pool" `
  --display-name="GitHub OIDC" `
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" `
  --attribute-condition="assertion.repository=='$Repo'" `
  --issuer-uri="https://token.actions.githubusercontent.com" 2>$null | Out-Null

# Permitir que SOLO ese repo actue como la cuenta de servicio
gcloud iam service-accounts add-iam-policy-binding $saEmail `
  --role="roles/iam.workloadIdentityUser" `
  --member="principalSet://iam.googleapis.com/projects/$projNum/locations/global/workloadIdentityPools/github-pool/attribute.repository/$Repo" | Out-Null

$provider = "projects/$projNum/locations/global/workloadIdentityPools/github-pool/providers/github-provider"

Write-Host "`n=== Pega estas VARIABLES en GitHub (Settings > Secrets and variables > Actions > Variables) ==="
Write-Host "GCP_PROJECT     = $project"
Write-Host "GCP_REGION      = $region"
Write-Host "SERVICE_NAME    = $service"
Write-Host "AUTH_ALLOWLIST  = $($map['AUTH_ALLOWLIST'])"
Write-Host "AUTH_URL        = (la URL de Cloud Run tras el primer despliegue)"
Write-Host "WIF_PROVIDER    = $provider"
Write-Host "DEPLOY_SA       = $saEmail"
Write-Host "`nListo. No se generaron llaves. GitHub se autentica por OIDC solo desde el repo $Repo."
