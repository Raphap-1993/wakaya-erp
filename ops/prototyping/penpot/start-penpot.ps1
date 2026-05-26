$ErrorActionPreference = "Stop"

$composeUrl = "https://raw.githubusercontent.com/penpot/penpot/main/docker/images/docker-compose.yaml"
$composeFile = Join-Path $PSScriptRoot "docker-compose.yaml"
$envExample = Join-Path $PSScriptRoot ".env.example"
$envFile = Join-Path $PSScriptRoot ".env"
$projectName = "wakaya-erp-penpot"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker no esta disponible en PATH."
}

if (-not (Test-Path -LiteralPath $composeFile)) {
  Write-Host "Descargando docker-compose.yaml oficial de Penpot..."
  Invoke-WebRequest -Uri $composeUrl -OutFile $composeFile
}

if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
}

docker compose --env-file $envFile -p $projectName -f $composeFile up -d

Write-Host "Penpot iniciado: http://localhost:9001"
Write-Host "Proyecto Docker Compose: $projectName"
