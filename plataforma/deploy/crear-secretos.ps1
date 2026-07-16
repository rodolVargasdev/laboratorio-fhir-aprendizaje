# Carga los secretos de .env.production en Google Secret Manager.
# Lo ejecutas TU en tu terminal; los valores nunca salen de tu maquina/GCP.
#   cd plataforma
#   .\deploy\crear-secretos.ps1
#
# Requisitos: gcloud instalado y autenticado (gcloud auth login).

param([string]$EnvFile = ".env.production")

if (-not (Test-Path $EnvFile)) {
  Write-Error "No existe $EnvFile. Copia .env.production.example a .env.production y rellena los valores."
  exit 1
}

# Parsear el .env (KEY="valor")
$map = @{}
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
    $v = $matches[2].Trim()
    if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
    $map[$matches[1]] = $v
  }
}

if ($map["GCP_PROJECT"]) {
  gcloud config set project $map["GCP_PROJECT"] | Out-Null
  Write-Host "Proyecto: $($map['GCP_PROJECT'])"
}

# Habilitar Secret Manager (idempotente)
gcloud services enable secretmanager.googleapis.com | Out-Null

$secretos = @("DATABASE_URL", "AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "GEMINI_API_KEY")

foreach ($name in $secretos) {
  $val = $map[$name]
  if ([string]::IsNullOrWhiteSpace($val)) { Write-Warning "Omitido (vacio): $name"; continue }

  # Escribir a un archivo temporal SIN salto de linea (crucial: un \n corrompe el secreto)
  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, $val)

  $null = gcloud secrets describe $name 2>$null
  if ($LASTEXITCODE -ne 0) {
    gcloud secrets create $name --data-file=$tmp --replication-policy=automatic | Out-Null
    Write-Host "Secreto creado:   $name"
  } else {
    gcloud secrets versions add $name --data-file=$tmp | Out-Null
    Write-Host "Secreto actualizado: $name"
  }
  Remove-Item $tmp -Force
}

Write-Host "`nListo. Secretos en Secret Manager. NUNCA subas .env.production a git."
