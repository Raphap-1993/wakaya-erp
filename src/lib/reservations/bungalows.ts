import type { Bungalow, BungalowCreateInput, BungalowUpdateInput } from "@/lib/reservations/types";

type NormalizedBungalowInput = {
  code: string;
  name: string;
  capacity: number;
  active: boolean;
};

function slugifySegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildBungalowId(code: string): string {
  const slug = slugifySegment(code);
  if (!slug) {
    throw new Error("invalid_bungalow_code");
  }
  return `bungalow-${slug}`;
}

export function normalizeBungalowInput(
  input: BungalowCreateInput | BungalowUpdateInput,
): NormalizedBungalowInput {
  const code = input.code.trim().toUpperCase();
  if (!code) {
    throw new Error("invalid_bungalow_code");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("invalid_bungalow_name");
  }

  const capacity = Number(input.capacity);
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new Error("invalid_bungalow_capacity");
  }

  return {
    code,
    name,
    capacity,
    active: input.active ?? true,
  };
}

export function bungalowHasDuplicateCode(
  items: Bungalow[],
  code: string,
  excludingId?: string,
): boolean {
  return items.some((item) => item.code.toUpperCase() === code.toUpperCase() && item.id !== excludingId);
}
