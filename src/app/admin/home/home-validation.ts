import { homeContentV2Schema } from "@/lib/home-content/schema";
import {
  HOME_SIZE_ADJUST_MAX_PX,
  HOME_SIZE_ADJUST_MIN_PX,
  HOME_WEIGHT_VALUE_MAX,
  HOME_WEIGHT_VALUE_MIN,
  type HomeContentDocument,
  type HomeSection,
} from "@/lib/home-content/types";

export type HomeValidationNode =
  | { kind: "slide"; id: string }
  | { kind: "section"; id: string }
  | { kind: "settings"; id: "navigation" };

export type HomeValidationIssueInput = {
  path: readonly PropertyKey[];
  message: string;
};

export type HomeValidationTarget = {
  key: string;
  node: HomeValidationNode;
  nodeLabel: string;
  locale?: "es" | "en";
  groupLabel: string;
  fieldLabel: string;
  focusOccurrence: number;
  message: string;
  summaryLabel: string;
};

const SECTION_LABELS: Record<HomeSection["type"], string> = {
  "booking-band": "Reservas",
  stats: "Cifras",
  story: "Historia",
  bungalows: "Bungalows",
  "quote-band": "Frase destacada",
  experiences: "Experiencias",
  testimonials: "Testimonios",
  "closing-cta": "Cierre",
};

const FIELD_LABELS: Record<string, string> = {
  allCategoriesLabel: "Label todas las categorías",
  autoplayMs: "Autoplay slider",
  bodySize: "Tamaño body",
  bodySizeAdjustPx: "Ajuste fino body (px)",
  bodyWeight: "Peso body",
  bodyWeightValue: "Peso exacto body",
  checkInLabel: "Label check-in",
  checkOutLabel: "Label check-out",
  copy: "Copy",
  ctaSize: "Tamaño CTA",
  ctaSizeAdjustPx: "Ajuste fino CTA (px)",
  ctaWeight: "Peso CTA",
  ctaWeightValue: "Peso exacto CTA",
  detailLabel: "Label detalle",
  duration: "Duración",
  eyebrow: "Eyebrow",
  eyebrowSize: "Tamaño eyebrow",
  eyebrowSizeAdjustPx: "Ajuste fino eyebrow (px)",
  eyebrowWeight: "Peso eyebrow",
  eyebrowWeightValue: "Peso exacto eyebrow",
  experienceIds: "Experiencias visibles",
  guestOptions: "Opciones de huéspedes (una por línea)",
  guestsLabel: "Label personas",
  headingSize: "Tamaño heading",
  headingSizeAdjustPx: "Ajuste fino heading (px)",
  headingWeight: "Peso heading",
  headingWeightValue: "Peso exacto heading",
  helper: "Helper",
  image: "Imagen",
  label: "Label",
  labelSize: "Tamaño labels",
  labelSizeAdjustPx: "Ajuste fino labels (px)",
  labelWeight: "Peso labels",
  labelWeightValue: "Peso exacto labels",
  name: "Nombre",
  order: "Orden",
  origin: "Origen",
  paragraphs: "Párrafos (uno por línea)",
  price: "Precio",
  quote: "Cita",
  quoteSource: "Fuente cita",
  roomLabel: "Label bungalow",
  scrollLabel: "Scroll label",
  source: "Fuente",
  submitHint: "Hint submit",
  subtitle: "Subtítulo",
  subtitleSize: "Tamaño subtítulo",
  subtitleSizeAdjustPx: "Ajuste fino subtítulo (px)",
  subtitleWeight: "Peso subtítulo",
  subtitleWeightValue: "Peso exacto subtítulo",
  title: "Título",
  type: "Tipo de sección",
  value: "Valor",
  visible: "Visible en home",
  visibleCount: "Cantidad visible",
};

const NAVIGATION_FIELD_LABELS: Record<string, string> = {
  linkSize: "Tamaño links menú",
  linkSizeAdjustPx: "Ajuste fino links menú (px)",
  linkWeight: "Peso links menú",
  linkWeightValue: "Peso exacto links menú",
  ctaSize: "Tamaño CTA menú",
  ctaSizeAdjustPx: "Ajuste fino CTA menú (px)",
  ctaWeight: "Peso CTA menú",
  ctaWeightValue: "Peso exacto CTA menú",
};

function normalizedPath(path: readonly PropertyKey[]) {
  const normalized = path.map((part) => (typeof part === "symbol" ? part.description ?? "field" : part));
  return normalized[0] === "document" ? normalized.slice(1) : normalized;
}

function lastString(path: Array<string | number>) {
  for (let index = path.length - 1; index >= 0; index -= 1) {
    if (typeof path[index] === "string" && path[index] !== "es" && path[index] !== "en") {
      return path[index] as string;
    }
  }
  return "field";
}

function resolveFocusOccurrence(path: Array<string | number>) {
  const itemsIndex = path.indexOf("items");
  if (itemsIndex >= 0 && typeof path[itemsIndex + 1] === "number") {
    return path[itemsIndex + 1] as number;
  }
  return 0;
}

function resolveNode(document: HomeContentDocument, path: Array<string | number>): {
  node: HomeValidationNode;
  nodeLabel: string;
} {
  if (path[0] === "navigation") {
    return {
      node: { kind: "settings", id: "navigation" },
      nodeLabel: "Configuración web",
    };
  }

  if (path[0] === "sections" && typeof path[1] === "number") {
    const section = document.sections[path[1]];
    if (section) {
      return {
        node: { kind: "section", id: section.id },
        nodeLabel: SECTION_LABELS[section.type],
      };
    }
  }

  const slideIndex = path[0] === "slider" && path[1] === "slides" && typeof path[2] === "number" ? path[2] : 0;
  const slide = document.slider.slides[slideIndex] ?? document.slider.slides[0];
  if (slide) {
    return {
      node: { kind: "slide", id: slide.id },
      nodeLabel: slide.content.es.title || slide.content.en.title || `Slide ${slideIndex + 1}`,
    };
  }

  const section = document.sections[0];
  return {
    node: section ? { kind: "section", id: section.id } : { kind: "settings", id: "navigation" },
    nodeLabel: section ? SECTION_LABELS[section.type] : "Configuración web",
  };
}

function resolveGroup(path: Array<string | number>) {
  if (path[0] === "navigation" || path.includes("style")) return "Opciones avanzadas";
  if (path.includes("primaryCta")) return "CTA principal";
  if (path.includes("secondaryCta")) return "CTA secundario";

  const ctasIndex = path.indexOf("ctas");
  if (ctasIndex >= 0) {
    const index = typeof path[ctasIndex + 1] === "number" ? (path[ctasIndex + 1] as number) : 0;
    return index === 0 ? "CTA principal" : `CTA ${index + 1}`;
  }

  if (path.includes("image")) return "Imagen";
  if (path.includes("order") || path.includes("visible") || path.join(".") === "slider.slides") {
    return "Estructura";
  }
  return "Contenido";
}

function resolveFieldLabel(document: HomeContentDocument, path: Array<string | number>, message: string) {
  if (message === "visible_slide_required" || path.join(".") === "slider.slides") return "Visible en home";
  if (path.includes("destination")) return path.includes("value") ? "Valor destino" : "Destino";

  const field = lastString(path);
  if (field === "quote" && path.includes("items")) return "Testimonio";
  if (field === "visibleCount" && path[0] === "sections" && typeof path[1] === "number") {
    const section = document.sections[path[1]];
    if (section?.type === "bungalows") return "Bungalows visibles";
    if (section?.type === "experiences") return "Cards visibles";
  }
  if (path[0] === "navigation") return NAVIGATION_FIELD_LABELS[field] ?? FIELD_LABELS[field] ?? "Configuración";
  return FIELD_LABELS[field] ?? "Campo requerido";
}

function resolveMessage(message: string) {
  switch (message) {
    case "required":
      return "Completa este campo.";
    case "invalid_cta_destination":
    case "invalid_internal_route":
      return "Ingresa un destino válido.";
    case "invalid_size_adjust":
      return `Usa un ajuste entre ${HOME_SIZE_ADJUST_MIN_PX} y ${HOME_SIZE_ADJUST_MAX_PX} px.`;
    case "invalid_weight_value":
      return `Usa un peso entre ${HOME_WEIGHT_VALUE_MIN} y ${HOME_WEIGHT_VALUE_MAX}.`;
    case "invalid_slide_image":
    case "invalid_section_image":
      return "Sube una imagen válida.";
    case "invalid_slide_order":
    case "invalid_section_order":
      return "Ingresa un orden mayor a 0.";
    case "invalid_autoplay_ms":
      return "Selecciona una duración válida para el slider.";
    case "invalid_heading_size":
    case "invalid_body_size":
    case "invalid_heading_weight":
    case "invalid_body_weight":
    case "invalid_cta_style":
      return "Selecciona una opción válida.";
    case "visible_slide_required":
      return "Deja al menos un slide visible.";
    case "duplicate_section_type":
      return "Revisa esta sección duplicada.";
    default:
      return "Revisa este campo.";
  }
}

export function mapHomeValidationIssues(
  document: HomeContentDocument,
  issues: readonly HomeValidationIssueInput[],
): HomeValidationTarget[] {
  return issues.map((issue, index) => {
    const path = normalizedPath(issue.path) as Array<string | number>;
    const { node, nodeLabel } = resolveNode(document, path);
    const locale = path.includes("es") ? "es" : path.includes("en") ? "en" : undefined;
    const fieldLabel = resolveFieldLabel(document, path, issue.message);
    const summaryLabel = [nodeLabel, locale === "es" ? "Español" : locale === "en" ? "English" : null, fieldLabel]
      .filter(Boolean)
      .join(" · ");

    return {
      key: `${path.join(".")}:${issue.message}:${index}`,
      node,
      nodeLabel,
      locale,
      groupLabel: resolveGroup(path),
      fieldLabel,
      focusOccurrence: resolveFocusOccurrence(path),
      message: resolveMessage(issue.message),
      summaryLabel,
    };
  });
}

export function validateHomeDocument(document: HomeContentDocument): HomeValidationTarget[] {
  const result = homeContentV2Schema.safeParse(document);
  return result.success ? [] : mapHomeValidationIssues(document, result.error.issues);
}

export function countValidationIssuesForNode(
  issues: readonly HomeValidationTarget[],
  node: HomeValidationNode,
) {
  return issues.filter((issue) => issue.node.kind === node.kind && issue.node.id === node.id).length;
}
