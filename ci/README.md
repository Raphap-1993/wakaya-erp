# CI

[README principal](../README.md) | [Indice docs](../docs/README.md)

Carpeta para documentar el baseline de pipeline y release del proyecto cuando todavia no existe una implementacion concreta en `.github/workflows/` u otra plataforma.

## Artefactos disponibles
- [pipeline-baseline.md](pipeline-baseline.md)
- [scripts/check-docs.mjs](scripts/check-docs.mjs) verifica BOM, enlaces internos, anclas, bloques `nav-guided`, simetria Anterior/Siguiente y ortografia reservada. Ejecutalo con `node ci/scripts/check-docs.mjs` antes de integrar cambios al repositorio.
- [scripts/check-markdown-paths.mjs](scripts/check-markdown-paths.mjs) verifica rutas dentro de backticks para que planes y checklists no apunten a archivos inexistentes.
- [scripts/check-template-instantiation.mjs](scripts/check-template-instantiation.mjs) verifica placeholders tecnicos y valores heredados de plantilla en `.github/`, `ops/`, `stacks/`, catalogos y otros artefactos de texto. Usa `node ci/scripts/check-template-instantiation.mjs --mode template --root .` sobre la plantilla base y `--mode instantiated` cuando el repo ya representa un proyecto real.
- [scripts/check-ai-artifacts.mjs](scripts/check-ai-artifacts.mjs) exige secciones minimas en prompts y skills oficiales de `ai/`.
- [scripts/check-github-actions.mjs](scripts/check-github-actions.mjs) evita patrones fragiles en workflows, como `secrets.*` usados directamente en condiciones `if`.

## Regla de uso
- Usa esta carpeta como puente entre arquitectura y operacion.
- Cuando el proyecto ya tenga workflows reales, manten esta carpeta como guia o reemplazala por referencias explicitas a la implementacion activa.
- El baseline minimo recomendado para adopcion profesional es: validacion documental, validacion de instanciacion tecnica, smoke check del stack bootstrappeado y CI verde en el stack ejecutable elegido.
