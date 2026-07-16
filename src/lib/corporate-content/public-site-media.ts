import type {
  PublicSiteMediaReference,
  PublicSiteMediaSlot,
} from "./types";

export const DEFAULT_PUBLIC_SITE_MEDIA: Record<
  PublicSiteMediaSlot,
  PublicSiteMediaReference
> = {
  logo: { kind: "external", url: "/images/wakaya/wakaya-logo-min.png" },
  aboutHero: { kind: "external", url: "/images/wakaya/company/about-recepcion.jpg" },
  aboutSecondary: { kind: "external", url: "/images/wakaya/company/about-naturaleza.jpg" },
  faqHero: { kind: "external", url: "/images/wakaya/company/about-naturaleza.jpg" },
  testimonialsHero: { kind: "external", url: "/images/wakaya/company/review-michael.jpg" },
  policiesHero: { kind: "external", url: "/images/wakaya/company/about-naturaleza.jpg" },
  bungalowsHero: { kind: "external", url: "https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png" },
  servicesHero: { kind: "external", url: "https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg" },
  galleryHero: { kind: "external", url: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery06.jpg" },
  contactHero: { kind: "external", url: "https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png" },
  eventsHero: { kind: "external", url: "https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg" },
  publicationsHero: { kind: "external", url: "https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png" },
  petFriendlyHero: { kind: "external", url: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery10.jpg" },
  complaintsHero: { kind: "external", url: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery04.jpg" },
};

export function resolvePublicSiteMedia(
  reference: PublicSiteMediaReference,
  variant: "heroDesktop" | "detail" = "heroDesktop",
) {
  if (reference.kind === "asset") {
    return `/media/assets/${reference.assetId}/${variant}.webp`;
  }
  return reference.kind === "external" ? reference.url : "";
}
