# Wakaya Guided Home Validation Implementation Plan

<!-- nav-guided:start -->
## Navegación guiada
- Anterior: [Diseño aprobado](../specs/2026-07-14-wakaya-guided-home-validation-design.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guiar al editor desde una publicación inválida hasta cada bloque, idioma y campo que debe corregir.

**Architecture:** Un adaptador puro reutiliza `homeContentV2Schema` y convierte cada incidencia Zod en un destino editorial estable. `HomeEditor` ejecuta preflight antes del `PUT`, deriva el resumen mientras se corrige el documento y usa selección, idioma y foco para navegar; la API y el documento persistido no cambian.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Zod 4, Vitest y Playwright.

---

### Task 1: Adaptador de incidencias editoriales

**Files:**
- Create: `src/app/admin/home/home-validation.ts`
- Create: `src/app/admin/home/home-validation.test.ts`

- [x] **Step 1: Write the failing mapping tests**

Crear casos que modifiquen `DEFAULT_HOME_CONTENT` y exijan destinos con esta
forma:

```ts
expect(validateHomeDocument(document)).toEqual(
  expect.arrayContaining([
    expect.objectContaining({
      node: { kind: "section", id: story.id },
      nodeLabel: "Historia",
      locale: "es",
      fieldLabel: "Título",
      message: "Completa este campo.",
    }),
  ]),
);
```

Agregar casos para CTA en inglés, estilo avanzado y `issues` del servidor con
prefijo `document`.

- [x] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/app/admin/home/home-validation.test.ts`

Expected: FAIL porque `home-validation.ts` todavía no existe.

- [x] **Step 3: Implement the minimal pure adapter**

Definir `HomeValidationTarget`, `validateHomeDocument`,
`mapHomeValidationIssues` y `countValidationIssuesForNode`. Usar
`homeContentV2Schema.safeParse`, normalizar el prefijo `document`, resolver el
índice a `slide.id`/`section.id` y traducir mensajes sin exponer paths.

- [x] **Step 4: Run the tests and verify GREEN**

Run: `npm test -- src/app/admin/home/home-validation.test.ts`

Expected: PASS para rutas de sección, slide, idioma, CTA, estilo y servidor.

- [x] **Step 5: Commit the adapter**

```bash
git add src/app/admin/home/home-validation.ts src/app/admin/home/home-validation.test.ts
git commit -m "feat: map home validation issues to editor fields"
```

### Task 2: Resumen, navegación y marcado accesible

**Files:**
- Modify: `src/app/admin/home/home-editor.tsx`
- Modify: `src/app/admin/home/home-editor.module.css`
- Modify: `src/app/admin/home/home-editor.test.tsx`

- [x] **Step 1: Write the failing editor assertions**

Extender el test estático para exigir que el árbol inicial tenga una región de
feedback preparada sin mostrar errores y que los botones/bloques mantengan
nombres operativos. El comportamiento interactivo se cubre en Task 3.

- [x] **Step 2: Run the focused editor test and verify RED**

Run: `npm test -- src/app/admin/home/home-editor.test.tsx`

Expected: FAIL en las nuevas marcas del resumen/destinos de validación.

- [x] **Step 3: Add client preflight and derived issue state**

En `publishChanges`, ejecutar `validateHomeDocument(document)` antes de activar
el estado de guardado. Si hay errores, hacer visible el resumen, navegar al
primero y retornar sin `fetch`. Mientras el resumen esté visible, recalcular las
incidencias con `useMemo` al cambiar el documento.

- [x] **Step 4: Render all issues and per-node counts**

Mostrar `No se puede publicar. Corrige N campos.`, una fila por incidencia y
`Ir al campo`. Reemplazar `Pendiente` por `Revisar · N campos` solo después de
un intento de publicación. Mantener el feedback existente para éxito, media,
red y conflicto.

- [x] **Step 5: Implement navigation and focus**

`goToValidationTarget` debe seleccionar slide/sección/configuración, activar
ES/EN, abrir `details` avanzado cuando aplique y enfocar el control. El control
activo recibe `aria-invalid="true"`, `aria-describedby` y estilo rojo. Limpiar
el marcado anterior antes de cambiar de destino.

- [x] **Step 6: Preserve server issues as fallback**

Si un `PUT` responde error con `body.issues`, pasar esas rutas a
`mapHomeValidationIssues`, mostrar el mismo resumen y navegar al primer destino.
Solo usar `describeSaveError` cuando la respuesta no incluya incidencias.

- [x] **Step 7: Run focused tests and typecheck**

Run: `npm test -- src/app/admin/home/home-validation.test.ts src/app/admin/home/home-editor.test.tsx && npm run typecheck`

Expected: PASS y TypeScript sin errores.

- [x] **Step 8: Commit the editor behavior**

```bash
git add src/app/admin/home/home-editor.tsx src/app/admin/home/home-editor.module.css src/app/admin/home/home-editor.test.tsx
git commit -m "feat: guide editors to invalid home fields"
```

### Task 3: Flujo autenticado y evidencia local

**Files:**
- Create: `e2e/home-validation.spec.ts`
- Create: `docs/fase-6-qa/06.07-guided-home-validation-local-evidence.md`
- Modify: `specs/010-content-editor-workbench/README.md`

- [x] **Step 1: Write the failing Playwright scenario**

Autenticar el backoffice, vaciar `Historia > Español > Título`, volver al slide,
pulsar publicar y exigir:

```ts
expect(homePutCount).toBe(0);
await expect(page.getByRole("alert")).toContainText("Historia · Español · Título");
await expect(page.getByRole("button", { name: /Historia.*Revisar · 1 campo/ })).toBeVisible();
await expect(page.getByLabel("Título")).toBeFocused();
await expect(page.getByLabel("Título")).toHaveAttribute("aria-invalid", "true");
```

- [x] **Step 2: Run the scenario and verify RED before the UI implementation**

Run: `E2E_BASE_URL=http://localhost:3212 npx playwright test e2e/home-validation.spec.ts`

Expected before Task 2: FAIL porque el aviso sigue siendo genérico. Si Task 2 ya
está aplicado, verificar RED contra su commit padre o conservar la salida RED de
Task 2 como evidencia TDD equivalente.

- [x] **Step 3: Run focused and full verification**

Run:

```bash
npm test -- src/app/admin/home/home-validation.test.ts src/app/admin/home/home-editor.test.tsx src/app/api/admin/home-content/route.test.ts
npm run typecheck
npx eslint src/app/admin/home/home-validation.ts src/app/admin/home/home-validation.test.ts src/app/admin/home/home-editor.tsx src/app/admin/home/home-editor.test.tsx e2e/home-validation.spec.ts
E2E_BASE_URL=http://localhost:3212 npx playwright test e2e/home-validation.spec.ts
npm run build
```

Expected: todas las verificaciones terminan con exit code 0.

- [x] **Step 4: Record evidence and stop before production**

Documentar comandos, resultados, captura local, riesgos residuales y rollback
(`git revert` de los commits del incremento). Mantener producción bloqueada.

- [x] **Step 5: Commit QA and documentation**

```bash
git add e2e/home-validation.spec.ts docs/fase-6-qa/06.07-guided-home-validation-local-evidence.md specs/010-content-editor-workbench docs/superpowers
git commit -m "test: verify guided home validation locally"
```

## Self-review

- Spec coverage: RF-010-10 se cubre en Tasks 1-3; los contratos vigentes no
  cambian.
- Placeholder scan: no existen pasos `TBD`, `TODO` ni delegaciones ambiguas.
- Type consistency: `HomeValidationTarget`, `validateHomeDocument`,
  `mapHomeValidationIssues` y `countValidationIssuesForNode` mantienen los
  mismos nombres en pruebas, editor y QA.
