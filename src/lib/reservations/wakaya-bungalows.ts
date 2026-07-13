import type { Bungalow } from "@/lib/reservations/types";

export type WakayaPublicBungalowCatalogEntry = Bungalow & {
  publicSlug:
    | "bungalow-familiar"
    | "bungalow-matrimonial"
    | "bungalow-individual"
    | "bungalow-doble"
    | "bungalow-triple";
  featuredOnHome: boolean;
  image: string;
};

export const WAKAYA_PUBLIC_BUNGALOW_CATALOG = [
  {
    id: "bungalow-family",
    code: "FAMILY",
    name: "Bungalow Familiar",
    active: true,
    capacity: 4,
    publicSlug: "bungalow-familiar",
    featuredOnHome: true,
    image: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg",
  },
  {
    id: "bungalow-matrimonial",
    code: "MATRIMONIAL",
    name: "Bungalow Matrimonial",
    active: true,
    capacity: 2,
    publicSlug: "bungalow-matrimonial",
    featuredOnHome: true,
    image: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg",
  },
  {
    id: "bungalow-individual",
    code: "INDIVIDUAL",
    name: "Bungalow Individual",
    active: true,
    capacity: 1,
    publicSlug: "bungalow-individual",
    featuredOnHome: false,
    image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery10.jpg",
  },
  {
    id: "bungalow-suite",
    code: "SUITE",
    name: "Bungalow Doble",
    active: true,
    capacity: 2,
    publicSlug: "bungalow-doble",
    featuredOnHome: true,
    image: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BD_1.jpg",
  },
  {
    id: "bungalow-triple",
    code: "TRIPLE",
    name: "Bungalow Triple",
    active: true,
    capacity: 3,
    publicSlug: "bungalow-triple",
    featuredOnHome: false,
    image: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg",
  },
] as const satisfies readonly WakayaPublicBungalowCatalogEntry[];

export const WAKAYA_OPERATIONAL_BUNGALOWS: readonly Bungalow[] = WAKAYA_PUBLIC_BUNGALOW_CATALOG.map(
  ({ publicSlug: _publicSlug, featuredOnHome: _featuredOnHome, image: _image, ...bungalow }) => bungalow,
);
