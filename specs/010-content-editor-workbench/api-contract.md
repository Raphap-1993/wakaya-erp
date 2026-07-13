# API Contract - Wakaya Content Editor Workbench

Esta feature no crea endpoints. Reutiliza los contratos versionados de Home,
contenido público, contenido corporativo y media.

## Invariantes

- `expectedVersion` continúa obligatorio en publicación/restauración.
- `content:write` continúa protegiendo mutaciones.
- la UI no envía IDs o URLs legadas como campos editables nuevos.
- respuestas públicas no cambian.
