# Tracking plan

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a analytics](README.md)

## Objetivo
Definir los eventos de producto que el proyecto captura, su proposito, propiedades permitidas, sensibilidad de datos y duenos.

## Evento base
| Campo | Descripcion |
|---|---|
| `event_name` | Nombre en `snake_case`, verbo + objeto |
| `owner` | Equipo o rol responsable |
| `trigger` | Accion que dispara el evento |
| `props` | Propiedades permitidas sin PII |
| `destination` | Warehouse, herramienta de analytics o stream |

## Regla
Ningun evento debe enviar PII en texto plano. Si se requiere correlacion, usar identificadores pseudonimizados y documentar base legal en `docs/transversal/90.16-privacidad-compliance.md`.
