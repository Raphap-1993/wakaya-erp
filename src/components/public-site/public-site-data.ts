export const publicNav = [
  { label: 'Inicio', href: '/prototype/public-site' },
  { label: 'Nosotros', href: '/prototype/public-site/about' },
  { label: 'Bungalows', href: '/prototype/public-site/bungalows' },
  { label: 'Servicios', href: '/prototype/public-site/services' },
  { label: 'Eventos', href: '/prototype/public-site/events' },
  { label: 'Galería', href: '/prototype/public-site/gallery' },
  { label: 'Publicaciones', href: '/prototype/public-site/publications' },
  { label: 'Contacto', href: '/prototype/public-site/contact' },
] as const;

export const publicFooterNav = [
  { label: 'Inicio', href: '/prototype/public-site' },
  { label: 'Nosotros', href: '/prototype/public-site/about' },
  { label: 'Bungalows', href: '/prototype/public-site/bungalows' },
  { label: 'Servicios', href: '/prototype/public-site/services' },
] as const;

export const publicBungalows = [
  {
    slug: 'bungalow-familiar',
    bookingRequestBungalowId: 'bungalow-family',
    name: 'Bungalow Familiar',
    homeName: undefined,
    featuredOnHome: true,
    eyebrow: 'Para familias y grupos pequeños',
    description:
      'Más amplitud para compartir jardines, piscina y descanso con una lectura clara de capacidad y tarifa base.',
    priceFrom: 'Desde S/ 350',
    capacity: '4 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg',
  },
  {
    slug: 'bungalow-matrimonial',
    bookingRequestBungalowId: 'bungalow-matrimonial',
    name: 'Bungalow Matrimonial',
    homeName: undefined,
    featuredOnHome: true,
    eyebrow: 'Para una estadía más íntima',
    description:
      'Una forma más directa de conocer Wakaya sin perder el tono premium ni la experiencia de naturaleza del lodge.',
    priceFrom: 'Desde S/ 250',
    capacity: '2 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg',
  },
  {
    slug: 'bungalow-doble',
    bookingRequestBungalowId: 'bungalow-suite',
    name: 'Bungalow Suite',
    homeName: undefined,
    featuredOnHome: true,
    eyebrow: 'Para descanso cálido y flexible',
    description:
      'La categoría más privada para una escapada amazónica más silenciosa, más cálida y con mejor sensación de retiro.',
    priceFrom: 'Desde S/ 420',
    capacity: '2 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg',
  },
  {
    slug: 'bungalow-triple',
    bookingRequestBungalowId: null,
    name: 'Bungalow Triple',
    homeName: undefined,
    featuredOnHome: false,
    eyebrow: 'Para grupos pequeños con más amplitud',
    description:
      'Una categoría amplia para grupos pequeños que necesitan más flexibilidad sin perder la atmósfera del lodge.',
    priceFrom: 'Desde S/ 380',
    capacity: '3 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg',
  },
] as const;

export const homeSlides = [
  {
    eyebrow: 'Hotel Wakaya Ecolodge',
    title: 'Un encuentro con lo mágico',
    copy:
      'Laguna, jardines, piscina y bungalows cálidos en una experiencia tropical premium.',
    image:
      'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png',
  },
  {
    eyebrow: 'Hospitalidad tropical',
    title: 'Lo mejor de la selva del Perú',
    copy:
      'Una llegada más emocional, más visual y más clara para reservar.',
    image:
      'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png',
  },
] as const;

export const testimonials = [
  {
    name: 'Familias',
    quote: 'Un entorno natural para descansar del ruido de la ciudad.',
  },
  {
    name: 'Parejas',
    quote: 'Bungalows cálidos, agua, jardines y mejor sensación de retiro.',
  },
] as const;

export const publications = [
  {
    slug: 'bodas-en-wakaya',
    title: 'Celebraciones en un entorno natural',
  },
  {
    slug: 'full-day-pucallpa',
    title: 'Cómo vivir un Full Day en Wakaya',
  },
] as const;

export const footerContact = {
  place: 'Pucallpa · Perú',
  domain: 'wakayaecolodge.com',
  note: 'Atención personalizada del equipo Wakaya',
};

export function getPublicBungalowLabel(bungalow: {
  homeName?: string | undefined;
  name: string;
}) {
  return bungalow.homeName ?? bungalow.name;
}
