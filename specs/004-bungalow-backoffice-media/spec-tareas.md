# Spec tareas - Wakaya Bungalow Backoffice Media

[README principal](../../README.md) | [Specs](../README.md)

## Contexto
- Feature: `004-bungalow-backoffice-media`
- Product Design: `product-design.md`
- SPDD: `spdd-frontend.md`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- API contract: `api-contract.md`
- Gate: `gate-spdd-approved` pendiente antes de construcción visual productiva

## T-001 - Reorganizar el formulario por superficies de trabajo

Estado: pendiente

Objetivo:
Reemplazar la pantalla larga actual por tabs `Operación`, `Ficha web` y
`Textos web`, con cabecera sticky compacta.

Entradas:
- `product-design.md`
- `spdd-frontend.md`

Archivos permitidos:
- `src/app/admin/bungalows/**`
- `src/app/admin/reservations/reservations.module.css`

Ciclo TDD:
1. Red: test del editor con tabs y sin duplicación de acciones.
2. Green: implementar estructura de tabs y cabecera.
3. Refactor: limpiar jerarquía visual y labels.

Comandos de verificación:
```bash
npm test -- src/app/admin/bungalows/[id]/page.test.tsx src/app/admin/bungalows/new/page.test.tsx
```

Trazabilidad:
- RF-01
- RF-02

## T-002 - Introducir modelo persistido de media para bungalows

Estado: pendiente

Objetivo:
Separar portada y galería a una capa de media estructurada con persistencia.

Entradas:
- `spec-tecnica.md`
- `api-contract.md`

Archivos permitidos:
- `db/migrations/**`
- `src/lib/reservations/**`

Ciclo TDD:
1. Red: tests de repositorio para hero y gallery persistidos.
2. Green: agregar tipos, schemas y persistencia.
3. Refactor: mantener compatibilidad transitoria con URLs legadas.

Comandos de verificación:
```bash
npm test -- src/lib/reservations/postgres-repository.test.ts src/lib/reservations/persistence.test.ts
npm run typecheck
```

Trazabilidad:
- RF-08
- RF-09

## T-003 - Crear upload server-side con optimización automática

Estado: pendiente

Objetivo:
Aceptar archivos desde backoffice, optimizarlos con `sharp` y guardarlos como
WebP con variantes.

Entradas:
- `spec-tecnica.md`
- `api-contract.md`

Archivos permitidos:
- `src/app/api/bungalows/**`
- `src/lib/reservations/**`

Ciclo TDD:
1. Red: tests de endpoints para hero y gallery.
2. Green: implementar parsing `multipart/form-data`, validaciones y optimización.
3. Refactor: extraer `MediaStorage` y `image-optimizer`.

Comandos de verificación:
```bash
npm test -- src/app/api/bungalows/**/*.test.ts
npm run typecheck
```

Trazabilidad:
- RF-03
- RF-04
- RF-10

## T-004 - Convertir la zona de imágenes en gestor visual

Estado: pendiente

Objetivo:
Permitir reemplazar portada, agregar imágenes y reordenar galería con previews y
acciones explícitas.

Entradas:
- `spdd-frontend.md`
- `ui-test-cases.md`

Archivos permitidos:
- `src/app/admin/bungalows/**`

Ciclo TDD:
1. Red: test del media manager con portada y galería.
2. Green: implementar previews, botones y fallback manual colapsado.
3. Refactor: separar componentes por responsabilidad.

Comandos de verificación:
```bash
npm test -- src/app/admin/bungalows/**/*.test.tsx
npm run typecheck
```

Trazabilidad:
- RF-05
- RF-06
- RF-07

## T-005 - Adaptar el lector público al bundle de media

Estado: pendiente

Objetivo:
Hacer que la web pública priorice variantes optimizadas y use fallback a URLs
legadas mientras dura la migración.

Entradas:
- `spec-tecnica.md`
- `api-contract.md`

Archivos permitidos:
- `src/app/[locale]/**`
- `src/components/public-site/**`
- `src/lib/reservations/**`

Ciclo TDD:
1. Red: test del mapper público con media estructurada.
2. Green: usar variantes `card`, `detail` y `thumb` según contexto.
3. Refactor: limpiar el fallback legado cuando la data nueva esté disponible.

Comandos de verificación:
```bash
npm test -- src/app/[locale]/**/*.test.tsx src/components/public-site/**/*.test.tsx
npm run typecheck
```

Trazabilidad:
- RF-08
- RF-09
