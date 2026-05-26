param(
  [string]$BaseUrl = "http://127.0.0.1:9001",
  [string]$Email,
  [securestring]$Password,
  [string]$Fullname = "Demo Wakaya ERP",
  [switch]$CreateProfile,
  [string]$BackendContainer = "wakaya-erp-penpot-penpot-backend-1",
  [string]$ProjectName = "Wakaya ERP - Fase 2 UX",
  [string]$FileName = "001-reservations - Prototipo UX"
)

$ErrorActionPreference = "Stop"

function ConvertFrom-SecureStringToPlainText {
  param([securestring]$Value)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Get-TransitUuid {
  param(
    [string]$Content,
    [string]$Key
  )
  $pattern = "~:$Key" + '"[,]"~u([^"]+)'
  $match = [regex]::Match($Content, $pattern)
  if (-not $match.Success) {
    throw "No se pudo extraer $Key de la respuesta Penpot."
  }
  $match.Groups[1].Value
}

if (-not $Email) {
  throw "Parametro requerido: -Email"
}

if (-not $Password) {
  $Password = Read-Host "Clave Penpot local" -AsSecureString
}

$plainPassword = ConvertFrom-SecureStringToPlainText -Value $Password

try {
  if ($CreateProfile) {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
      throw "Docker no esta disponible en PATH."
    }

    try {
      docker exec $BackendContainer ./manage.py create-profile --fullname $Fullname --email $Email --password $plainPassword --skip-tutorial --skip-walkthrough
    } catch {
      Write-Warning "No se pudo crear el perfil. Si ya existe, se continuara con login. Detalle: $($_.Exception.Message)"
    }
  }

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginBody = @{ email = $Email; password = $plainPassword } | ConvertTo-Json -Compress
  Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/rpc/command/login-with-password" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session | Out-Null

  $profileResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/rpc/command/get-profile" -Method Get -WebSession $session
  $profileText = [System.Text.Encoding]::UTF8.GetString($profileResponse.Content)
  $teamId = Get-TransitUuid -Content $profileText -Key "default-team-id"

  $projectBody = @{ name = $ProjectName; teamId = $teamId } | ConvertTo-Json -Compress
  $projectResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/rpc/command/create-project" -Method Post -Body $projectBody -ContentType "application/json" -WebSession $session
  $projectText = [System.Text.Encoding]::UTF8.GetString($projectResponse.Content)
  $projectId = Get-TransitUuid -Content $projectText -Key "id"

  $fileBody = @{ name = $FileName; projectId = $projectId; isShared = $true } | ConvertTo-Json -Compress
  $fileResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/rpc/command/create-file" -Method Post -Body $fileBody -ContentType "application/json" -WebSession $session
  $fileText = [System.Text.Encoding]::UTF8.GetString($fileResponse.Content)
  $fileId = Get-TransitUuid -Content $fileText -Key "id"

  $workspaceUrl = "$BaseUrl/#/workspace/$fileId"
  $dashboardUrl = "$BaseUrl/#/dashboard/recent?team-id=$teamId"
  $date = Get-Date -Format "yyyy-MM-dd"
  $evidencePath = Join-Path $PSScriptRoot "evidence-$date.md"

  $evidence = @"
# Evidencia operativa Penpot - $date

[README Penpot local](README.md) | [Checklist](prototype-checklist.md)

## Contexto
- Proyecto: Wakaya ERP
- Feature: 001-reservations
- Fecha: $date
- Responsable: proveedor IA / agente interno

## Ejecucion
- Base URL: $BaseUrl
- Usuario local: $Email
- Proyecto Penpot: $ProjectName
- Archivo Penpot: $FileName

## Identificadores
- Team ID: $teamId
- Project ID: $projectId
- File ID: $fileId
- Workspace URL: $workspaceUrl
- Dashboard URL: $dashboardUrl

## Resultado
- Penpot local accesible: si
- Archivo de prototipo creado: si
- Componentes reutilizables verificados: pendiente
- Frames y conexiones del prototipo: pendiente de construir desde SPDD
- Link/export registrado en prototype.md: pendiente

## Observaciones
- La clave no se guarda en este archivo.
- El archivo Penpot queda listo para poblar frames, componentes reutilizables e interacciones desde la documentacion de Fase 2.
"@

  Set-Content -LiteralPath $evidencePath -Value $evidence -Encoding UTF8

  Write-Host "Penpot project id: $projectId"
  Write-Host "Penpot file id: $fileId"
  Write-Host "Workspace: $workspaceUrl"
  Write-Host "Dashboard: $dashboardUrl"
  Write-Host "Evidencia: $evidencePath"
} finally {
  $plainPassword = $null
}
