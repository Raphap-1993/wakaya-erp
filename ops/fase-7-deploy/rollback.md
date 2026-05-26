# Rollback

[README principal](../../README.md)

## Criterios de activacion
- Error rate sobre umbral.
- Latencia p95 degradada.
- Fallo de autenticacion generalizado.
- Incidente funcional bloqueante.

## Procedimiento
1. Congelar nuevos despliegues.
2. Restaurar imagen previa.
3. Revertir configuracion si aplica.
4. Validar health checks.
5. Comunicar estado a stakeholders.
