create table if not exists bungalow_public_content (
  bungalow_id text primary key references bungalow(id) on delete cascade,
  featured_on_home boolean not null default false,
  sort_order integer not null default 0,
  hero_image_url text not null,
  gallery_urls text[] not null default '{}'::text[],
  nightly_rate_pen integer not null,
  area_sqm integer not null,
  locale_content jsonb not null,
  updated_at timestamptz not null
);

create index if not exists idx_bungalow_public_content_home_sort
  on bungalow_public_content (featured_on_home desc, sort_order asc);
