# Politica de retencion

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ops/data](README.md)

Define por cuanto tiempo se conserva cada tipo de dato y como se elimina. Toda entrada de esta tabla nace de una obligacion legal, contractual o de negocio documentada.

## Tabla base

| Dominio           | Dato                     | Retencion | Base                | Accion al vencer           | Owner    |
|-------------------|--------------------------|-----------|---------------------|----------------------------|----------|
| Expedientes       | Metadatos activos        | 10 anos   | Obligacion legal    | Mover a archivo cifrado    | Legal    |
| Expedientes       | Documentos adjuntos      | 10 anos   | Obligacion legal    | Mover a archivo cifrado    | Legal    |
| Usuarios          | Cuenta activa            | Indefinida| Relacion contractual| Mantener                   | Producto |
| Usuarios          | Cuenta eliminada         | 30 dias   | Derecho al olvido   | Purga definitiva           | DPO      |
| Audit log aplicativo | Entradas              | 24 meses  | Auditoria + GDPR    | Archivado WORM 36 meses    | SRE + DPO|
| Logs aplicativos  | Stdout estructurado      | 90 dias   | Operacion           | Purga automatica           | SRE      |
| Metricas          | Series Prometheus        | 13 meses  | DORA + capacidad    | Downsample y purga         | SRE      |
| Trazas            | Spans OpenTelemetry      | 14 dias   | Operacion           | Purga automatica           | SRE      |
| Backups           | Snapshots RDS            | 35 dias   | RPO/RTO + forense   | Purga automatica           | SRE      |
| CI/CD artefactos  | Imagenes, SBOM, attestaciones | 18 meses | Supply chain  | Purga con approval         | SRE      |
| Notificaciones email | Contenido + bounces   | 12 meses  | Operacion + spam    | Purga automatica           | Producto |

## Reglas transversales
- Toda retencion superior a la tabla requiere aprobacion del DPO y debe quedar como legal hold.
- El borrado logico aplica inmediatamente; la purga fisica puede programarse semanal/mensualmente.
- Cada purga genera un evento `audit.retencion.purga.v1` con el conteo y el scope.
- La retencion por defecto para datos Restringidos nuevos es 12 meses hasta que ROPA documente otra.

## Procedimiento de revision
1. Revisar esta tabla cada 6 meses en sesion DPO + SRE + Producto.
2. Verificar que la politica esta implementada (job corriendo, logs con resultado).
3. Ajustar por cambios regulatorios (GDPR, LGPD, sectoriales).
4. Publicar diff en `releases/vX.Y.Z.md` y `CHANGELOG.md`.
