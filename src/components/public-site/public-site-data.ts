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

export const publicBungalows = [
  {
    slug: 'bungalow-familiar',
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
    name: 'Bungalow Doble',
    homeName: 'Bungalow Suite',
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

export const footerContact = {
  place: 'Pucallpa · Perú',
  domain: 'wakayaecolodge.com',
  note: 'Atención personalizada del equipo Wakaya',
};
