# Deploy feature - Cambio de estado de expediente

## Alcance
- habilita endpoint transaccional de cambio de estado
- habilita accion de UI sobre detalle de expediente

## Verificaciones previas
- tablas o estructuras de historial disponibles
- auditoria habilitada y accesible
- politicas de autorizacion desplegadas para roles operativos

## Verificaciones posteriores
- `PATCH /api/expedientes/{id}/estado` procesa una transicion valida
- una transicion invalida devuelve error controlado
- el historial visible refleja el nuevo estado

## Riesgo de despliegue
- Alto: una falla puede comprometer consistencia de negocio o auditoria.
