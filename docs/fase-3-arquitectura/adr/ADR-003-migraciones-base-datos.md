# ADR-003 - Migraciones de base de datos con Flyway

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-002 - Gestor de configuracion y secretos](ADR-002-configuracion-y-secretos.md)
- Siguiente: [ADR-004 - Observabilidad con OpenTelemetry](ADR-004-observabilidad-opentelemetry.md)
<!-- nav-guided:end -->

## Decision
Usar Flyway con archivos SQL versionados como herramienta canonica de migracion en los stacks Java (monolito, Quarkus y Spring). Para el stack Node + Next.js se utiliza `node-pg-migrate` cuando se active la persistencia, siguiendo las mismas convenciones de nombres y orden.

## Contexto
El caso canonico necesita un mecanismo de migracion trazable, reproducible y compatible con pipelines automaticos. Flyway tiene soporte nativo en Spring Boot y Quarkus, lo que reduce la configuracion. SQL plano facilita revisiones y evita que la logica de esquema quede atrapada en una DSL propietaria.

## Opciones consideradas
- Flyway + SQL plano (esta decision).
- Liquibase con changelogs XML/YAML.
- ORM migrations (JPA `ddl-auto`, Prisma Migrate, TypeORM).
- Migraciones manuales ejecutadas por el DBA.

## Consecuencias
- Los equipos pueden leer, diffear y revisar cambios de esquema sin herramientas adicionales.
- Se impone la disciplina de migraciones inmutables y numeradas.
- Cambios destructivos requieren plan de dos releases (documentado en `03.06-modelo-datos.md`).
- Para stacks no Java se incorpora una herramienta adicional; la convencion de nombres se mantiene.

## Trazabilidad
- Documento de referencia: [03.06-modelo-datos.md](../03.06-modelo-datos.md).
- Configuracion: [03.05-configuracion-secretos.md](../03.05-configuracion-secretos.md).
- Plan de despliegue: [03.03-plan-despliegue.md](../03.03-plan-despliegue.md).
