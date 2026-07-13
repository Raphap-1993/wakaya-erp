# Spec tareas - Wakaya Home Content Management

[README principal](../../README.md) | [Specs](../README.md)

## Contexto
- Feature: `005-home-content-management`
- Product Design: `product-design.md`
- SPDD: `spdd-frontend.md`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- API contract: `api-contract.md`
- Gate: `gate-spdd-approved` pendiente antes de construccion productiva

## T-005-001 - Crear dominio `home-content`

Estado: pendiente

Objetivo:
Definir tipos, defaults, schema y mapper publico del documento del home.

Entradas:
- `spec-funcional.md`
- `spec-tecnica.md`

Archivos permitidos:
- `src/lib/home-content/**`

Ciclo TDD:
1. Red: tests del schema para slider visible, CTA segura y presets.
2. Green: tipos, defaults y validacion.
3. Refactor: separar mapper publico del documento persistido.

Comandos de verificacion:
```bash
npm test -- src/lib/home-content/**/*.test.ts
```

Trazabilidad:
- RF-HOME-01
- RF-HOME-02
- RF-HOME-03
- RF-HOME-05

## T-005-002 - Persistir publicacion y revisiones

Estado: pendiente

Objetivo:
Agregar almacenamiento publicado + revisiones con concurrencia optimista y
fallback seguro.

Entradas:
- `spec-tecnica.md`
- `api-contract.md`

Archivos permitidos:
- `db/migrations/**`
- `src/lib/home-content/**`
- `src/lib/reservations/**`

Ciclo TDD:
1. Red: tests de repositorio para get, publish y restore.
2. Green: migracion, store y persistencia.
3. Refactor: cache de ultimo payload valido.

Comandos de verificacion:
```bash
npm test -- src/lib/home-content/**/*.test.ts src/lib/reservations/postgres-repository.test.ts
```

Trazabilidad:
- RF-HOME-06
- RF-HOME-07

## T-005-003 - Exponer APIs admin y RBAC

Estado: pendiente

Objetivo:
Implementar endpoints admin del home con permiso `content:write`.

Entradas:
- `api-contract.md`
- `spec-tecnica.md`

Archivos permitidos:
- `src/app/api/admin/**`
- `src/lib/rbac.ts`
- `src/middleware/authn.ts`

Ciclo TDD:
1. Red: tests de `GET`, `PUT`, `revisions` y `restore`.
2. Green: handlers y permiso nuevo.
3. Refactor: normalizar errores y conflicto 409.

Comandos de verificacion:
```bash
npm test -- src/app/api/admin/**/*.test.ts src/middleware/authn.test.ts
```

Trazabilidad:
- RF-HOME-06
- RF-HOME-07
- RF-HOME-09

## T-005-004 - Implementar media segura para el home

Estado: pendiente

Objetivo:
Permitir reemplazo de imagenes del home desde endpoint admin seguro.

Entradas:
- `api-contract.md`
- `spec-tecnica.md`

Archivos permitidos:
- `src/app/api/admin/**`
- `src/lib/home-content/**`
- `src/lib/reservations/**`

Ciclo TDD:
1. Red: tests de upload valido e invalido.
2. Green: reuse del pipeline server-side.
3. Refactor: adaptador de media reutilizable.

Comandos de verificacion:
```bash
npm test -- src/app/api/admin/**/*.test.ts src/lib/reservations/bungalow-media.test.ts
```

Trazabilidad:
- RF-HOME-03
- RF-HOME-06

## T-005-005 - Construir `/admin/home`

Estado: pendiente

Objetivo:
Crear el editor de home con barra sticky, rail, editor localizable, preview y
revisiones.

Entradas:
- `spdd-frontend.md`
- `ui-test-cases.md`

Archivos permitidos:
- `src/app/admin/home/**`
- `src/app/admin/admin-navigation.ts`
- `src/app/admin/admin-shell.module.css`

Ciclo TDD:
1. Red: tests de seleccion de seccion, tabs ES/EN y estados.
2. Green: pantalla y componentes.
3. Refactor: dividir por responsabilidades.

Comandos de verificacion:
```bash
npm test -- src/app/admin/**/*.test.tsx
```

Trazabilidad:
- RF-HOME-01
- RF-HOME-02
- RF-HOME-03
- RF-HOME-04
- RF-HOME-05
- RF-HOME-07

## T-005-006 - Integrar el home publico localizado

Estado: pendiente

Objetivo:
Hacer que `src/app/[locale]/page.tsx` renderice el documento validado sin
romper booking requests ni bungalows.

Entradas:
- `spec-funcional.md`
- `spec-tecnica.md`

Archivos permitidos:
- `src/app/[locale]/**`
- `src/components/public-site/**`
- `src/lib/home-content/**`

Ciclo TDD:
1. Red: tests del home localizado con documento persistido.
2. Green: renderizado publico por seccion.
3. Refactor: aislar compatibilidad con snapshot actual.

Comandos de verificacion:
```bash
npm test -- 'src/app/[locale]/**/*.test.tsx' 'src/components/public-site/**/*.test.tsx'
```

Trazabilidad:
- RF-HOME-04
- RF-HOME-06
- RF-HOME-08

## T-005-007 - Verificacion integral y evidencia

Estado: pendiente

Objetivo:
Cerrar TDD, e2e, typecheck y evidencia del home editable.

Entradas:
- `ui-test-cases.md`
- `traceability.md`

Archivos permitidos:
- `e2e/**`
- `docs/**`
- `specs/005-home-content-management/**`

Ciclo TDD:
1. Red: e2e de publicacion y restore.
2. Green: correcciones finales.
3. Refactor: documentar deuda previa del checkout.

Comandos de verificacion:
```bash
npm test
npm run typecheck
npm run check:docs
```

Trazabilidad:
- RF-HOME-01
- RF-HOME-02
- RF-HOME-03
- RF-HOME-04
- RF-HOME-05
- RF-HOME-06
- RF-HOME-07
- RF-HOME-08
- RF-HOME-09
