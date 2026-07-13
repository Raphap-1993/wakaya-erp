create table if not exists media_asset (
  id text primary key,
  storage_key text not null unique,
  checksum_sha256 text not null,
  mime_type text not null,
  format text not null,
  width integer not null,
  height integer not null,
  byte_size bigint not null,
  status text not null default 'processing',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_variant (
  id text primary key,
  asset_id text not null references media_asset(id) on delete cascade,
  slot text not null,
  storage_key text not null unique,
  format text not null,
  width integer not null,
  height integer not null,
  quality integer,
  crop_spec jsonb,
  byte_size bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_media_variant_asset_slot
  on media_variant (asset_id, slot);

create table if not exists content_experience (
  id text primary key,
  slug text not null unique,
  visible boolean not null default true,
  featured_on_home boolean not null default false,
  sort_order integer not null default 0,
  icon_key text not null default 'experience',
  locale_content jsonb not null,
  card_asset_id text references media_asset(id) on delete set null,
  hero_asset_id text references media_asset(id) on delete set null,
  gallery_asset_ids text[] not null default '{}'::text[],
  version integer not null default 1,
  deleted_at timestamptz
);

alter table if exists content_experience
  add column if not exists featured_on_home boolean not null default false;

alter table if exists content_experience
  add column if not exists icon_key text not null default 'experience';

alter table if exists content_experience
  add column if not exists gallery_asset_ids text[] not null default '{}'::text[];

create index if not exists idx_content_experience_visible_sort
  on content_experience (visible desc, sort_order asc, slug asc);

create table if not exists content_gallery (
  id text primary key check (id = 'global'),
  version integer not null default 1,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists content_gallery_item (
  id text primary key,
  gallery_id text not null references content_gallery(id) on delete cascade,
  asset_id text not null references media_asset(id) on delete restrict,
  visible boolean not null default true,
  sort_order integer not null default 0,
  locale_content jsonb not null,
  archived_at timestamptz
);

create unique index if not exists idx_content_gallery_item_order
  on content_gallery_item (gallery_id, sort_order);

alter table if exists bungalow_public_content
  add column if not exists revision_version integer not null default 1;

alter table if exists bungalow_public_content
  add column if not exists hero_asset_id text references media_asset(id) on delete set null;

alter table if exists bungalow_public_content
  add column if not exists gallery_asset_ids text[] not null default '{}'::text[];

alter table if exists booking_request
  add column if not exists requested_experience_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_request_requested_experience_id_fkey'
  ) then
    alter table booking_request
      add constraint booking_request_requested_experience_id_fkey
      foreign key (requested_experience_id)
      references content_experience(id)
      on delete set null;
  end if;
end $$;
