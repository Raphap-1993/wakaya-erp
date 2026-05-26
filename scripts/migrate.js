#!/usr/bin/env node

const action = process.argv[2] ?? "up";

console.error(
  [
    `Placeholder de migraciones invocado con accion: ${action}.`,
    "Implementa este script segun el motor de persistencia elegido antes de usarlo en un pipeline real.",
    "Referencia: docs/fase-3-arquitectura/03.06-modelo-datos.md y ADR-003.",
  ].join("\n"),
);

process.exit(1);
