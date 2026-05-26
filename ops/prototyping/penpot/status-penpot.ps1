$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.yaml"
$envExample = Join-Path $PSScriptRoot ".env.example"
$envFile = Join-Path $PSScriptRoot ".env"
$projectName = "wakaya-erp-penpot"

if (Test-Path -LiteralPath $composeFile) {
  if (-not (Test-Path -LiteralPath $envFile)) {
    Copy-Item -LiteralPath $envExample -Destination $envFile
  }
  docker compose --env-file $envFile -p $projectName -f $composeFile ps
} else {
  Write-Host "docker-compose.yaml aun no fue descargado."
}

try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:9001" -UseBasicParsing -TimeoutSec 5
  Write-Host "Penpot HTTP status: $($response.StatusCode)"
} catch {
  Write-Host "Penpot no responde todavia en http://127.0.0.1:9001"
}
