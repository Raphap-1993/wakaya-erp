# Clasificacion de datos

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ops/data](README.md)

Matriz de clasificacion de datos y controles asociados. Todo dato manejado por la plantilla pertenece a una clase y hereda sus controles.

## Clases

| Clase | Descripcion | Ejemplos | Impacto si se filtra |
|-------|-------------|----------|----------------------|
| Publica | Puede publicarse sin restriccion. | Documentacion abierta, metricas DORA agregadas. | Ninguno. |
| Interna | Solo empleados o colaboradores autorizados. | Estructura del backlog, notas de arquitectura. | Bajo (ventaja competitiva). |
| Confidencial | Acceso por necesidad. | PII basica, logs con correlationId y userId, datos contractuales. | Medio (confianza, exposicion legal). |
| Restringida | Acceso controlado y trazado. | Categorias especiales GDPR, financieros, secretos, tokens. | Alto (regulatorio, reputacional). |

## Controles por clase

| Control                    | Publica | Interna | Confidencial | Restringida |
|----------------------------|---------|---------|--------------|-------------|
| Cifrado en transito        | TLS 1.2 | TLS 1.2 | TLS 1.2      | TLS 1.3 mTLS donde aplique |
| Cifrado en reposo          | Opt     | Si      | Si (KMS)     | Si + KMS dedicada + doble envoltorio |
| RBAC                       | Abierto | Por grupo | Por rol + justificado | Por rol + aprobacion + tiempo |
| Audit trail                | No      | Opcional | Si           | Si, inmutable |
| Tokenizacion / hashing     | No      | No      | Recomendado  | Obligatorio para campos sensibles |
| Retencion (por defecto)    | Indefinida | 12 meses | 36 meses | Politica explicita (ROPA) |
| Revision de accesos        | Anual   | Semestral | Trimestral  | Mensual |
| Export / backup offsite    | Abierto | Interno | Cifrado      | Cifrado + Object Lock |

## Tagging y descubribilidad
- Toda tabla lleva metadatos: `data_class`, `owner`, `retention`, `ropa_ref`.
- Todo topic de eventos declara su `data_class` en el registry de esquemas.
- Los logs anotan `data_class` cuando el payload estructurado contiene campos sensibles.
- El escaner de PII del pipeline bloquea commits con patrones de dato Restringido en codigo o docs.

## Flujos prohibidos
- Copiar datos Restringidos a dev sin anonimizar.
- Exponer datos Confidenciales o Restringidos en respuestas API sin control de acceso.
- Enviar PII en URLs.
- Incluir datos Restringidos en logs o trazas.

## Matriz por dominio (ejemplo)

| Entidad        | Campo            | Clase         | Controles adicionales |
|----------------|------------------|---------------|-----------------------|
| usuario        | email            | Confidencial  | Hash SHA-256 en analytics |
| usuario        | telefono         | Confidencial  | Tokenizacion al analizar |
| expediente     | identificador    | Interna       | -- |
| expediente     | cuerpo documento | Restringida   | Cifrado aplicativo + acceso auditado |
| facturacion    | numero tarjeta   | Restringida   | Nunca se guarda, solo el token del proveedor |
| audit_log      | actor.ip         | Confidencial  | Retencion segun 90.16 |

Revisar la matriz al menos semestralmente y cada vez que se agregue una entidad nueva.
