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
    eyebrow: 'Para familias y grupos pequeños',
    priceFrom: 'Desde S/ 350',
    capacity: '4 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg',
  },
  {
    slug: 'bungalow-matrimonial',
    name: 'Bungalow Matrimonial',
    eyebrow: 'Para una estadía más íntima',
    priceFrom: 'Desde S/ 250',
    capacity: '2 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg',
  },
  {
    slug: 'bungalow-doble',
    name: 'Bungalow Doble',
    eyebrow: 'Para descanso cálido y flexible',
    priceFrom: 'Desde S/ 320',
    capacity: '2 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg',
  },
  {
    slug: 'bungalow-triple',
    name: 'Bungalow Triple',
    eyebrow: 'Para grupos pequeños con más amplitud',
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
