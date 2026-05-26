# ADR-002 - Gestor de configuracion y secretos

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-001 - Stack Quarkus Angular y Keycloak](ADR-001-stack-quarkus-angular-keycloak.md)
- Siguiente: [ADR-003 - Migraciones de base de datos](ADR-003-migraciones-base-datos.md)
<!-- nav-guided:end -->

## Decision
Usar variables de entorno con un gestor central de secretos (AWS Secrets Manager o HashiCorp Vault, segun el entorno de despliegue). Los valores no sensibles se declaran en `application.yml` / `next.config.mjs`. Los secretos se inyectan al runtime mediante el mecanismo nativo del orquestador (Kubernetes secrets, ECS parameters o equivalente).

## Contexto
La plantilla apunta a proyectos profesionales con requisitos de rotacion, auditoria y separacion de entornos. Cualquier alternativa que persista secretos en texto plano en el repositorio queda descartada por politica. El equipo necesita una forma homogenea de describir configuracion en los cuatro stacks.

## Opciones consideradas
- Variables de entorno + gestor central de secretos.
- Archivos cifrados por entorno (sops, ansible-vault) en el repositorio.
- Configuracion 100% en base de datos propietaria.
- Config central propia (microservicio de configuracion).

## Consecuencias
- Flujo uniforme: todos los stacks leen configuracion del entorno y `.env.example` documenta el contrato.
- Se introduce una dependencia externa al gestor de secretos para los entornos no-local.
- La trazabilidad de cambios depende del log del gestor elegido.
- Se simplifica la entrega de parches urgentes (solo rotar secreto afectado).

## Trazabilidad
- Documento de configuracion: [03.05-configuracion-secretos.md](../03.05-configuracion-secretos.md).
- Checklist de arquitectura: [03.04-checklist-arquitectura.md](../03.04-checklist-arquitectura.md).
- Definiciones operativas: [90.18-definiciones-operativas.md](../../transversal/90.18-definiciones-operativas.md).
