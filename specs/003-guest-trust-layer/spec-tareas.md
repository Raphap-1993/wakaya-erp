# Spec tareas - Wakaya Guest Trust Layer

[README principal](../../README.md) | [Specs](../README.md)

## Contexto
- Feature: `003-guest-trust-layer`.
- Product Design: `product-design.md`.
- SPDD: `spdd-frontend.md`.
- Spec funcional: `spec-funcional.md`.
- Spec tecnica: `spec-tecnica.md`.
- API contract: `api-contract.md`.
- Gate: `gate-4-6`.

## T-001 - Señales públicas de confianza

Estado: pendiente

Objetivo:
Agregar shortcuts visibles de confianza en footer y corregir la booking band mobile.

Entradas:
- `spec-funcional.md`
- `spdd-frontend.md`

Archivos permitidos:
- `src/components/public-site/**`
- `src/app/[locale]/**`

Ciclo TDD:
1. Red: test del footer con links nuevos y CTA mobile no cubierta.
2. Green: implementar footer y ajustes responsive.
3. Refactor: limpiar copy y estilos.

Comandos de verificacion:
```bash
npm run test -- src/components/public-site/play-footer.test.tsx
```

Trazabilidad:
- RF-01
- RNF-02

## T-002 - Políticas públicas y página pet friendly

Estado: pendiente

Objetivo:
Exponer páginas públicas para políticas y viaje con mascotas.

Entradas:
- `product-design.md`
- `spec-funcional.md`

Archivos permitidos:
- `src/app/[locale]/**`
- `src/components/public-site/**`

Ciclo TDD:
1. Red: test/routing de páginas nuevas.
2. Green: crear páginas y links.
3. Refactor: ajustar copy y SEO.

Comandos de verificacion:
```bash
npm run test
```

Trazabilidad:
- RF-02
- RF-03

## T-003 - Libro de Reclamaciones online

Estado: pendiente

Objetivo:
Permitir ingreso público de quejas y reclamos con constancia.

Entradas:
- `spec-tecnica.md`
- `api-contract.md`

Archivos permitidos:
- `src/app/api/**`
- `src/lib/reservations/**`
- `src/app/[locale]/**`
- `src/components/public-site/**`

Ciclo TDD:
1. Red: test del endpoint y formulario.
2. Green: implementar modelo, endpoint y form.
3. Refactor: normalizar nombres y mensajes.

Comandos de verificacion:
```bash
npm run test
npm run typecheck
```

Trazabilidad:
- RF-04
- RF-05

## T-004 - Bandeja interna de reclamos

Estado: pendiente

Objetivo:
Listar y abrir reclamos desde admin.

Entradas:
- `spec-funcional.md`
- `spec-tecnica.md`

Archivos permitidos:
- `src/app/admin/**`
- `src/lib/reservations/**`
- `src/lib/rbac.ts`

Ciclo TDD:
1. Red: test de listado admin vacío/poblado.
2. Green: crear páginas y lecturas.
3. Refactor: alinear navegación y estados.

Comandos de verificacion:
```bash
npm run test
npm run typecheck
```

Trazabilidad:
- RF-06
