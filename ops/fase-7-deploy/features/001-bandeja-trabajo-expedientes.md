# Deploy feature - Bandeja de trabajo de expedientes

## Alcance
- habilita endpoints de consulta de expedientes
- habilita modulo frontend de bandeja operativa

## Verificaciones previas
- indices de consulta aplicados
- variables de configuracion de auditoria disponibles
- contrato frontend y backend versionado de forma consistente

## Verificaciones posteriores
- `GET /api/expedientes` responde correctamente
- `GET /api/expedientes/{id}` responde para un expediente permitido
- la interfaz muestra resultados, estado vacio y error controlado

## Riesgo de despliegue
- Medio: la feature es de lectura, pero una mala consulta puede degradar rendimiento operativo.
