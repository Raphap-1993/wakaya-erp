# Deploy feature - Historial y auditoria visible de expediente

## Alcance
- habilita endpoint de historial visible
- habilita modulo frontend de timeline o tabla de auditoria

## Verificaciones previas
- eventos de auditoria disponibles en el ambiente
- indices de consulta historica aplicados
- contratos de historial compartidos entre frontend y backend

## Verificaciones posteriores
- `GET /api/expedientes/{id}/historial` responde correctamente
- el historial muestra eventos recientes del expediente
- un evento generado por `002` aparece en la vista visible

## Riesgo de despliegue
- Medio: la feature es de lectura, pero puede exponer inconsistencia funcional si negocio y auditoria no estan alineados.
