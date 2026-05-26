// Cliente minimo de feature flags para desarrollo y tests.
//
// El objetivo es dejar una interfaz estable para la app sin amarrarla todavia
// a un proveedor concreto. En un proyecto real puedes reemplazar esta
// implementacion por OpenFeature, Unleash, LaunchDarkly, flagd, ConfigCat, etc.
//
// Ver docs/transversal/90.17-feature-flags.md.

export interface EvaluationContext {
  targetingKey?: string;
  [key: string]: boolean | number | string | undefined;
}

const defaultFlags = {
  "bandeja.virtual_scroll.enabled": {
    variants: { on: true, off: false },
    defaultVariant: "off",
    disabled: false,
  },
  "wakaya-erp.busqueda_v2.enabled": {
    variants: { on: true, off: false },
    defaultVariant: "off",
    disabled: false,
  },
} as const;

let initialized = false;

export async function initFeatureFlags(): Promise<void> {
  if (initialized) return;
  initialized = true;
}

export function flagsClient() {
  return {
    async getBooleanValue(
      flagKey: keyof typeof defaultFlags,
      fallback: boolean,
      _context: EvaluationContext = {},
    ) {
      const definition = defaultFlags[flagKey];
      if (!definition || definition.disabled) {
        return fallback;
      }
      return definition.variants[definition.defaultVariant] ?? fallback;
    },
  };
}

export async function isFeatureEnabled(
  flagKey: keyof typeof defaultFlags,
  fallback: boolean,
  context: EvaluationContext = {},
): Promise<boolean> {
  await initFeatureFlags();
  return flagsClient().getBooleanValue(flagKey, fallback, context);
}

// Ejemplo de uso:
//
//   const enabled = await isFeatureEnabled(
//     "bandeja.virtual_scroll.enabled",
//     false,
//     { targetingKey: userId },
//   );
//   if (enabled) { /* render nueva UI */ }
