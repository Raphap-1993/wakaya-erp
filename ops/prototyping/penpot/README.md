# Penpot local - Prototipos Fase 2

[README principal](../../../README.md) | [Fase 2 UX](../../../docs/fase-2-ux-ui/README.md)

## Objetivo
Levantar Penpot en Docker para crear y mostrar el prototipo clickable de Wakaya ERP sin depender de SaaS externo.

## Fuente oficial
El `docker-compose.yaml` se descarga desde la ruta oficial documentada por Penpot:

```text
https://raw.githubusercontent.com/penpot/penpot/main/docker/images/docker-compose.yaml
```

Documentacion oficial:

```text
https://help.penpot.app/technical-guide/getting-started/docker/
```

## Requisitos
- Docker instalado.
- Docker Compose disponible como `docker compose`.
- Puerto local `9001` libre.
- Acceso a internet la primera vez para descargar el compose y las imagenes.

## Arranque local
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\ops\prototyping\penpot\start-penpot.ps1
```

Penpot queda disponible en:

```text
http://localhost:9001
```

## Estado
```powershell
.\ops\prototyping\penpot\status-penpot.ps1
```

## Apagado
```powershell
.\ops\prototyping\penpot\stop-penpot.ps1
```

## Uso en Fase 2
1. Abrir http://localhost:9001.
2. Crear cuenta local si la instancia lo solicita, o usar el script operacional:

```powershell
$password = Read-Host "Clave Penpot local" -AsSecureString
.\ops\prototyping\penpot\create-prototype-file.ps1 -Email demo@local.penpot -Password $password -CreateProfile
```

3. Crear archivo Penpot: Wakaya ERP.
4. Construir pantallas desde:
   - specs/001-reservations/product-design.md
   - specs/001-reservations/spdd-frontend.md
   - specs/001-reservations/ui-test-cases.md
   - ai/prompts/generated/penpot-001-reservations.md
5. El enlace o evidencia Penpot se registra en specs/001-reservations/prototype.md.

## Evidencia para Gate Prototype Ready
- Penpot accesible en http://localhost:9001 o URL final.
- Archivo Penpot creado.
- Libreria de componentes reutilizables creada.
- Pantallas minimas cubiertas.
- Checklist de validacion completo.
- Trazabilidad hacia RF/HU/specs y prototype-validation.md.
- Evidencia operativa registrada en ops/prototyping/penpot/evidence-template.md o un archivo fechado.
