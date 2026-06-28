# Wakaya Local Readiness Handoff

Fecha: 2026-06-02

## Objetivo de esta revision

Definir si Wakaya estaba en punto de seguir prototipando o de pasar a construccion.

## Conclusion operativa

- No hace falta volver a prototipar desde cero.
- Tampoco conviene abrir una nueva tanda de construccion sin endurecer antes el baseline.
- La recomendacion inmediata es: hardening corto del baseline local, luego continuar construccion sobre una base verde.

## Estado local verificado

- La app levanta en local con:

```sh
env PORT=3200 AUTH_DEV_BYPASS=true WAKAYA_RESERVATIONS_DB_PATH=.data/wakaya-reservations.sqlite npm run dev
```

- `/` muestra un launcher con dos superficies:
  - `http://localhost:3200/prototype/public-site`
  - `http://localhost:3200/admin/reservations`
- El prototipo publico ya tiene una direccion visual consistente y navegable.
- El monitor interno ya renderiza lista, filtros, stats y links a detalle.
- `POST /api/public/reservations` crea prereservas locales en sqlite.
- `npm run test` paso completo: `24/24` tests.

## Hallazgos que bloquean seguir construccion con tranquilidad

### 1. El baseline no esta buildable

`npm run typecheck` falla y `npm run build` cae despues del compile por errores de TypeScript.

Errores detectados:

- [src/app/api/public/reservations/route.ts](/Users/rapha/Projects/wakaya-erp/src/app/api/public/reservations/route.ts:12)
  - spread sobre `rawBody` tipado como `unknown`
- [src/components/public-site/play-header.tsx](/Users/rapha/Projects/wakaya-erp/src/components/public-site/play-header.tsx:41)
  - `Link` con anchors hash no cuadra con typed routes de Next 16
- [src/lib/i18n.ts](/Users/rapha/Projects/wakaya-erp/src/lib/i18n.ts:9)
  - depende de `next-intl/server`, pero el paquete no esta instalado ni integrado
- [src/lib/pii-redact.ts](/Users/rapha/Projects/wakaya-erp/src/lib/pii-redact.ts:23)
  - firma del replacer incompatible con el tipo declarado
- [tests/contract/resource.pact.test.ts](/Users/rapha/Projects/wakaya-erp/tests/contract/resource.pact.test.ts:9)
  - matcher `iso8601DateTime` no existe en la version instalada de Pact

### 2. El flujo del monitor no esta cerrado end-to-end

- La lista del monitor carga bien en `/admin/reservations`.
- Abrir una fila demo en `/admin/reservations/reservation-demo-1` devuelve `404`.
- El punto a revisar primero es [src/app/admin/reservations/[id]/page.tsx](/Users/rapha/Projects/wakaya-erp/src/app/admin/reservations/%5Bid%5D/page.tsx:50), porque el lookup no encuentra la reserva aunque la fila existe en la lista.

### 3. Hay drift documental

- [AI_CONTEXT.md](/Users/rapha/Projects/wakaya-erp/AI_CONTEXT.md:1) todavia describia el repo como si estuviera casi en fase 0.
- El codigo real ya incluye:
  - launcher
  - prototipo publico premium
  - monitor interno
  - APIs de reservas
  - store local con sqlite
  - tests

## Señales positivas

- El split de producto ya existe y se entiende:
  - publico premium en [src/app/prototype/public-site/page.tsx](/Users/rapha/Projects/wakaya-erp/src/app/prototype/public-site/page.tsx:1)
  - monitor operativo en [src/app/admin/reservations/page.tsx](/Users/rapha/Projects/wakaya-erp/src/app/admin/reservations/page.tsx:1)
- La API interna responde en local:
  - `GET /api/reservations`
- La API publica crea prereservas:
  - `POST /api/public/reservations`
- Durante la verificacion se creo la reserva local `RESERVATION-2026-0003`.

## Notas para retomar

- Branch observado durante la revision: `codex/task1-public-prototype-docs`
- El worktree ya tenia cambios locales antes de este handoff; no asumir arbol limpio.
- El review local uso `AUTH_DEV_BYPASS=true`, por lo que OIDC sigue pendiente de configuracion real.
- La data local de reservas vive en `.data/wakaya-reservations.sqlite`.

## Orden recomendado para la proxima sesion

1. Dejar `typecheck` y `build` en verde.
2. Arreglar el detalle del monitor para que lista -> detalle funcione end-to-end.
3. Revalidar localmente:
   - `/prototype/public-site`
   - `/admin/reservations`
   - `POST /api/public/reservations`
4. Recien ahi elegir foco de continuidad:
   - endurecer web publica
   - endurecer monitor interno
   - seguir construccion funcional de reservations

## Comandos de arranque utiles

```sh
cd /Users/rapha/Projects/wakaya-erp
env PORT=3200 AUTH_DEV_BYPASS=true WAKAYA_RESERVATIONS_DB_PATH=.data/wakaya-reservations.sqlite npm run dev
npm run test
npm run typecheck
npm run build
```
