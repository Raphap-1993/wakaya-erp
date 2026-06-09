# Wakaya Admin Shell Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the internal backoffice under a single `/admin` shell with one visual system, compact sidebar navigation, and a shared contextual header for all operational modules.

**Architecture:** Create a global admin layout that wraps all `/admin/**` routes. The shell owns the navigation chrome, module switching, and context header; each page owns only its content. `Reservas`, `Ocupación`, and future modules must render inside the same container so color, spacing, hierarchy, and active states remain consistent.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, existing reservations monitor views and tests.

---

## Problem Statement

Today the backoffice is fragmented:

- `Reservas` and `Ocupación` use the same domain but feel like separate products.
- Navigation is duplicated inside individual pages.
- Visual density, card styling, and top actions are inconsistent across admin routes.
- There is no single shell for future modules like `Pagos`, `Reportes`, or `Configuración`.

The result is a backoffice that works, but does not feel like one coherent product.

## Design Goals

- Use one shared admin shell for all `/admin` routes.
- Keep the shell compact and operational, not decorative.
- Make `Reservas` and `Ocupación` feel like two views of the same system.
- Provide clear module navigation without forcing users to hunt for routes.
- Preserve the existing public site untouched.
- Leave room for future modules without another redesign.

## Non-Goals

- Do not redesign the public site.
- Do not change business logic for reservations, occupancy, payments, or audit.
- Do not introduce services or new domains into the shell.
- Do not build a full permissions framework in this slice.

## Proposed Shell

The admin shell should have three stable regions:

1. **Compact sidebar**
   - Fixed on the left in desktop.
   - Collapses to a drawer or minimal rail on smaller screens.
   - Contains module entries in this order:
     - `Reservas`
     - `Ocupación`
     - `Pagos`
     - `Reportes`
     - `Configuración`
   - Shows the active module clearly.

2. **Top contextual header**
   - Shows the current module title.
   - Shows a short breadcrumb or location label.
   - Shows the operational context when available, such as selected date, week, or status.
   - Hosts a small set of quick actions for the active module.

3. **Content surface**
   - Renders the active page content.
   - Uses the same spacing, card radius, borders, and background language across modules.
   - Does not repeat module navigation.

## Navigation Rules

- `Reservas` is the primary operational entry point.
- `Ocupación` is the sibling operational map for bungalow inventory.
- `Pagos` and `Reportes` are next-tier operational modules.
- `Configuración` is the last item and should feel secondary.
- The active item must always be visually obvious.
- The shell must preserve the current page context when switching between `Reservas` and `Ocupación`.

## Visual Rules

- Use one shared background system for all admin screens.
- Use one shared card system for all admin content.
- Keep accent colors muted and operational.
- Avoid making `Reservas` and `Ocupación` look like separate themes.
- The admin shell should feel denser and more structured than the public site.

## Responsive Behavior

- On desktop, the sidebar stays visible and compact.
- On narrow screens, the sidebar collapses to a drawer or minimal rail.
- The header remains visible and becomes the primary context anchor on small screens.
- Content cards stack vertically when the viewport cannot support the dual-column layout.

## Files in Scope

- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/admin-shell.tsx`
- Create: `src/app/admin/admin-shell.module.css`
- Modify: `src/app/admin/reservations/page.tsx`
- Modify: `src/app/admin/reservations/occupancy/page.tsx`
- Modify: `src/app/admin/reservations/page.test.tsx`
- Modify: `src/app/admin/reservations/occupancy/page.test.tsx`
- Modify: `src/app/admin/reservations/reservations.module.css` only if the shared shell needs small compatibility adjustments

## Acceptance Criteria

- `/admin/reservations` and `/admin/reservations/occupancy` render inside the same shell.
- The shell shows the same sidebar and contextual header for both routes.
- The active module is visible in the navigation.
- The existing reservations workflows continue to function.
- The occupancy view keeps its weekly bungalow map and detail panel.
- The public site remains unchanged.
- The visual language becomes consistent enough that both internal views read as one product.

## Test Strategy

- Add tests that confirm the admin shell is present for both routes.
- Verify the active module state in the sidebar.
- Verify the navigation includes the expected module names.
- Keep existing reservations and occupancy behavioral tests intact.

