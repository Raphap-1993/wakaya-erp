#!/usr/bin/env node
// Generador cross-platform de reglas Prometheus desde OpenSLO v1.
//
// Lee ops/observability/slos.yaml y emite un archivo Prometheus con:
//   - recording rules: <slo>:sli_ratio:<window> para ventanas 5m, 30m, 1h, 2h, 6h, 1d, 3d.
//   - alerting rules: burn-rate fast y slow siguiendo multi-window multi-burn-rate.
//
// Uso:
//   node ops/observability/generate-slo-rules.mjs \
//       --in ops/observability/slos.yaml \
//       --out ops/observability/prometheus-rules-slo.yaml
//
// Nota: este generador es intencionalmente minimalista. Para flujos productivos
// se recomienda Pyrra, Sloth o OpenSLO CLI, que soportan mas edge cases.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--in") { args.input = value; i += 1; continue; }
    if (flag === "--out") { args.output = value; i += 1; continue; }
    if (flag === "-h" || flag === "--help") { args.help = true; continue; }
    throw new Error(`Argumento desconocido: ${flag}`);
  }
  return args;
}

function usage() {
  console.log(`Uso:
  node ops/observability/generate-slo-rules.mjs --in <slos.yaml> --out <rules.yaml>
`);
}

// Parser YAML minimalista limitado a la forma de OpenSLO usada en slos.yaml.
// No sustituye a una libreria YAML; asume estructura conocida.
function parseYamlDocuments(text) {
  const docs = [];
  const normalizedText = text.replace(/\r\n?/g, "\n");
  for (const block of normalizedText.split(/\n---\n/)) {
    const trimmed = block.replace(/^---\n/, "").trim();
    if (!trimmed) continue;
    docs.push(parseSingleDocument(trimmed));
  }
  return docs;
}

function parseSingleDocument(text) {
  const lines = text.split("\n").filter((line) => !/^\s*#/.test(line));
  const root = {};
  const stack = [{ indent: -1, container: root }];

  for (const line of lines) {
    if (line.trim() === "") continue;
    const indent = line.match(/^\s*/)[0].length;
    const content = line.slice(indent);

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].container;

    if (content.startsWith("- ")) {
      const valueLine = content.slice(2);
      if (!Array.isArray(parent.__list)) {
        const parentKey = parent.__lastKey;
        const grand = stack[stack.length - 2]?.container;
        if (parentKey && grand && !Array.isArray(grand[parentKey])) {
          grand[parentKey] = [];
          const newContainer = grand[parentKey];
          stack[stack.length - 1] = { indent, container: newContainer, __list: true };
        }
      }
      const listContainer = stack[stack.length - 1].__list
        ? stack[stack.length - 1].container
        : (() => {
            const parentKey = stack[stack.length - 1].__lastKey;
            const grand = stack[stack.length - 2]?.container;
            if (parentKey && grand) {
              grand[parentKey] = grand[parentKey] ?? [];
              return grand[parentKey];
            }
            return null;
          })();
      if (listContainer) {
        if (valueLine.includes(": ")) {
          const obj = {};
          const [k, v] = splitKeyValue(valueLine);
          obj[k] = coerce(v);
          listContainer.push(obj);
          stack.push({ indent, container: obj });
        } else {
          listContainer.push(coerce(valueLine));
        }
      }
      continue;
    }

    if (content.includes(":")) {
      const [key, rawValue] = splitKeyValue(content);
      if (rawValue === "") {
        parent[key] = {};
        stack.push({ indent, container: parent[key], __lastKey: key });
      } else if (rawValue === "|") {
        parent[key] = "";
        stack.push({ indent, container: { __literal: (v) => (parent[key] = v) }, __lastKey: key });
      } else {
        parent[key] = coerce(rawValue);
      }
      parent.__lastKey = key;
    }
  }

  delete root.__lastKey;
  return root;
}

function splitKeyValue(line) {
  const idx = line.indexOf(":");
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  return [key, value];
}

function coerce(raw) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null" || raw === "~") return null;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (/^-?\d*\.\d+$/.test(raw)) return Number(raw);
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  return raw;
}

function findResource(docs, kind, name) {
  return docs.find((doc) => doc.kind === kind && doc?.metadata?.name === name);
}

function buildRulesFromSlo(slo, docs) {
  const rules = [];
  const sloName = slo.metadata.name;
  const objective = Array.isArray(slo.spec?.objectives) ? slo.spec.objectives[0] : null;
  const target = Number(objective?.target ?? 0.99);
  const burnBudget = 1 - target;

  const sliName = slo.spec?.indicator?.metadata?.name;
  const sli = sliName ? findResource(docs, "SLI", sliName) : null;
  const goodQuery = sli?.spec?.ratioMetric?.good?.metricSource?.spec?.query;
  const totalQuery = sli?.spec?.ratioMetric?.total?.metricSource?.spec?.query;

  if (!goodQuery || !totalQuery) {
    return rules;
  }

  const windows = ["5m", "30m", "1h", "2h", "6h", "1d", "3d"];
  for (const window of windows) {
    rules.push({
      record: `slo:sli_ratio:${window}:${sloName}`,
      expr: `(${goodQuery.replace(/\[5m\]/g, `[${window}]`)}) / (${totalQuery.replace(/\[5m\]/g, `[${window}]`)})`,
    });
  }

  rules.push({
    alert: `${sloName}-burn-rate-fast`,
    expr: `(1 - slo:sli_ratio:1h:${sloName}) > (14.4 * ${burnBudget.toFixed(6)}) and (1 - slo:sli_ratio:5m:${sloName}) > (14.4 * ${burnBudget.toFixed(6)})`,
    for: "2m",
    labels: { severity: "page", slo: sloName },
    annotations: {
      summary: `Burn rate rapido (14.4x) sobre SLO ${sloName}`,
      description: "Consumo de error budget a ritmo de agotar 2% del presupuesto en 1 hora.",
    },
  });
  rules.push({
    alert: `${sloName}-burn-rate-slow`,
    expr: `(1 - slo:sli_ratio:6h:${sloName}) > (6 * ${burnBudget.toFixed(6)}) and (1 - slo:sli_ratio:30m:${sloName}) > (6 * ${burnBudget.toFixed(6)})`,
    for: "15m",
    labels: { severity: "ticket", slo: sloName },
    annotations: {
      summary: `Burn rate lento (6x) sobre SLO ${sloName}`,
      description: "Deterioro sostenido del error budget en ventana de 6 horas.",
    },
  });

  return rules;
}

function rulesToYaml(rules) {
  const lines = ["groups:", "  - name: slo.rules", "    rules:"];
  for (const rule of rules) {
    if (rule.record) {
      lines.push(`      - record: ${rule.record}`);
      lines.push(`        expr: ${JSON.stringify(rule.expr)}`);
    } else if (rule.alert) {
      lines.push(`      - alert: ${rule.alert}`);
      lines.push(`        expr: ${JSON.stringify(rule.expr)}`);
      lines.push(`        for: ${rule.for}`);
      lines.push("        labels:");
      for (const [k, v] of Object.entries(rule.labels ?? {})) {
        lines.push(`          ${k}: ${JSON.stringify(v)}`);
      }
      lines.push("        annotations:");
      for (const [k, v] of Object.entries(rule.annotations ?? {})) {
        lines.push(`          ${k}: ${JSON.stringify(v)}`);
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return 0; }
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const input = path.resolve(args.input ?? path.join(here, "slos.yaml"));
  const output = path.resolve(args.output ?? path.join(here, "prometheus-rules-slo.yaml"));

  if (!fs.existsSync(input)) {
    console.error(`No existe input: ${input}`);
    return 1;
  }
  const text = fs.readFileSync(input, "utf8");
  const docs = parseYamlDocuments(text);
  const slos = docs.filter((d) => d.kind === "SLO");
  if (slos.length === 0) {
    console.error("No se encontraron recursos kind: SLO en el archivo.");
    return 1;
  }

  const rules = [];
  for (const slo of slos) {
    rules.push(...buildRulesFromSlo(slo, docs));
  }

  const yaml = rulesToYaml(rules);
  fs.writeFileSync(output, yaml, "utf8");
  console.log(`Generadas ${rules.length} reglas en ${output}`);
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exit(1);
}
