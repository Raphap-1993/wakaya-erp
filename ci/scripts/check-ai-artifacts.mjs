#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SKILL_SECTIONS = [
  "## Anti-rationalizations",
  "## Red flags",
  "## Verification evidence",
];

const PROMPT_SECTIONS = [
  "## No lo uses cuando",
  "## Verificacion minima",
];

// v12.94: secciones obligatorias por CONCEPTO (no por titulo literal). Antes se
// exigia el heading exacto (text.includes("## Componentes principales")), lo que
// premiaba conformidad de wording sobre sustancia y forzaba alinear archivos a un
// titulo fijo. Ahora cada concepto acepta SINONIMOS (regex sobre el texto del
// heading) y ademas exige que la seccion NO este vacia (sustancia real).
// Cada concepto: { label, re (sobre el texto del heading, sin los #), example }.
const SPEC_TECNICA_CONCEPTS = [
  { label: "Modelo de datos", re: /(modelo de datos|data model|esquema de datos|modelo de bd|modelo de base de datos)/i, example: "## Modelo de datos" },
];

const SPEC_FUNCIONAL_CONCEPTS = [
  { label: "Requerimientos", re: /(requerimientos|requisitos|requirements)/i, example: "## Requerimientos" },
  { label: "Criterios de aceptacion", re: /(criterios de aceptaci|acceptance criteria)/i, example: "## Criterios de aceptacion" },
  { label: "Reglas de negocio", re: /(reglas de negocio|business rules|reglas del dominio)/i, example: "## Reglas de negocio" },
];

const SPDD_FRONTEND_CONCEPTS = [
  { label: "Componentes", re: /(componentes|components)/i, example: "## Componentes principales" },
  { label: "Estados UI", re: /(estados|states)/i, example: "## Estados UI" },
  { label: "Permisos / roles", re: /(permisos|roles|autorizaci|permissions)/i, example: "## Permisos visibles" },
];

function readMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md")
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

// v12.35: recolectar spec-tecnica.md de todas las features.
function readSpecTecnicaFiles(rootDir) {
  return readSpecFiles(rootDir, "spec-tecnica.md");
}
// v12.36: recolectar spec-funcional.md de todas las features.
function readSpecFuncionalFiles(rootDir) {
  return readSpecFiles(rootDir, "spec-funcional.md");
}
// v12.37: recolectar spdd-frontend.md (solo de features que lo tengan).
function readSpddFrontendFiles(rootDir) {
  return readSpecFiles(rootDir, "spdd-frontend.md");
}
function readSpecFiles(rootDir, fileName) {
  const specsDir = path.join(rootDir, "specs");
  if (!fs.existsSync(specsDir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const stPath = path.join(specsDir, entry.name, fileName);
    if (fs.existsSync(stPath)) out.push(stPath);
  }
  return out;
}

function checkSections(rootDir, files, requiredSections, findings) {
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const section of requiredSections) {
      if (!text.includes(section)) {
        const relative = path.relative(rootDir, file).replace(/\\/g, "/");
        findings.push(`${relative}:1: falta seccion requerida ${section}`);
      }
    }
  }
}

// v12.94: parte el markdown en secciones {heading, level, line, body} por headings ##+.
function parseSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^(#{2,})\s+(.*\S)\s*$/);
    if (m) {
      if (current) sections.push(current);
      current = { level: m[1].length, heading: m[2], line: i + 1, body: [] };
    } else if (current) {
      current.body.push(lines[i]);
    }
  }
  if (current) sections.push(current);
  return sections;
}

// v12.94: ¿el cuerpo de una seccion tiene SUSTANCIA? (no solo el heading vacio).
// Sustancia = al menos una linea no vacia que no sea otro heading ni un comentario.
function hasSubstance(bodyLines) {
  return bodyLines.some((l) => {
    const t = l.trim();
    if (!t) return false;
    if (/^#{1,6}\s/.test(t)) return false;       // subheading, no cuenta como cuerpo
    if (/^<!--/.test(t)) return false;            // comentario
    return t.length >= 3;
  });
}

// v12.94: valida por CONCEPTO (sinonimos via regex) + SUSTANCIA (seccion no vacia).
// Reemplaza la coincidencia exacta de titulo: el agente cubre el concepto con el
// wording que prefiera, pero la seccion debe existir y tener contenido real.
function checkConcepts(rootDir, files, concepts, findings) {
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const sections = parseSections(text);
    const relative = path.relative(rootDir, file).replace(/\\/g, "/");
    for (const concept of concepts) {
      const match = sections.find((s) => concept.re.test(s.heading));
      if (!match) {
        findings.push(`${relative}:1: falta seccion para el concepto "${concept.label}" (usa un encabezado como "${concept.example}" o sinonimo).`);
        continue;
      }
      if (!hasSubstance(match.body)) {
        findings.push(`${relative}:${match.line}: la seccion "${match.heading}" (concepto "${concept.label}") esta vacia — agrega contenido real (bullets/tabla/parrafo).`);
      }
    }
  }
}

function main() {
  const rootDir = path.resolve(process.argv[2] || ".");
  const findings = [];

  // Skills/prompts: convencion estable del template (titulos exactos).
  checkSections(rootDir, readMarkdownFiles(path.join(rootDir, "ai", "skills")), SKILL_SECTIONS, findings);
  checkSections(rootDir, readMarkdownFiles(path.join(rootDir, "ai", "prompts")), PROMPT_SECTIONS, findings);
  // Artefactos por feature (autorados por el agente): por CONCEPTO + sustancia (v12.94).
  checkConcepts(rootDir, readSpecTecnicaFiles(rootDir), SPEC_TECNICA_CONCEPTS, findings);
  checkConcepts(rootDir, readSpecFuncionalFiles(rootDir), SPEC_FUNCIONAL_CONCEPTS, findings);
  checkConcepts(rootDir, readSpddFrontendFiles(rootDir), SPDD_FRONTEND_CONCEPTS, findings);

  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(finding);
    }
    console.error(`\nTotal hallazgos: ${findings.length}`);
    return 1;
  }

  console.log("OK. Artefactos IA cumplen anatomia minima (skills + prompts + spec-tecnica + spec-funcional + spdd-frontend).");
  return 0;
}

process.exit(main());
