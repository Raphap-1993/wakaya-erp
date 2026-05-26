$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.yaml"
$envExample = Join-Path $PSScriptRoot ".env.example"
$envFile = Join-Path $PSScriptRoot ".env"
$projectName = "wakaya-erp-penpot"

if (-not (Test-Path -LiteralPath $composeFile)) {
  Write-Host "No existe docker-compose.yaml local. Nada que apagar."
  exit 0
}

if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
}

docker compose --env-file $envFile -p $projectName -f $composeFile down
Write-Host "Penpot detenido."
