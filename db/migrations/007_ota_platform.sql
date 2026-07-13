alter table if exists reservation
  add column if not exists guest_name text,
  add column if not exists guest_email text,
  add column if not exists guest_phone text,
  add column if not exists guest_count integer,
  add column if not exists source_provider text,
  add column if not exists external_reservation_id text,
  add column if not exists external_property_id text,
  add column if not exists external_room_type_code text,
  add column if not exists external_rate_plan_code text,
  add column if not exists provider_status text,
  add column if not exists provider_payload_checksum text,
  add column if not exists provider_last_event_at timestamptz;

create unique index if not exists idx_reservation_provider_external_id
  on reservation (source_provider, external_reservation_id)
  where source_provider is not null and external_reservation_id is not null;

create table if not exists ota_connection (
  id uuid primary key,
  provider_key text not null,
  account_label text not null,
  external_property_id text,
  is_active boolean not null default true,
  messages_enabled boolean not null default false,
  ari_enabled boolean not null default false,
  recovery_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_ota_connection_provider_active
  on ota_connection (provider_key, is_active, updated_at desc);

create table if not exists ota_room_mapping (
  id uuid primary key,
  connection_id uuid not null references ota_connection(id) on delete cascade,
  external_room_type_code text not null,
  bungalow_id text references bungalow(id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (connection_id, external_room_type_code)
);

create table if not exists ota_rate_plan_mapping (
  id uuid primary key,
  connection_id uuid not null references ota_connection(id) on delete cascade,
  external_rate_plan_code text not null,
  internal_rate_plan_code text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (connection_id, external_rate_plan_code)
);

create table if not exists ota_reservation_link (
  reservation_id uuid primary key references reservation(id) on delete cascade,
  provider_key text not null,
  connection_id uuid references ota_connection(id) on delete set null,
  external_reservation_id text not null,
  external_property_id text,
  external_room_type_code text,
  external_rate_plan_code text,
  provider_status text,
  provider_payload_checksum text,
  provider_event_version text,
  provider_thread_id text,
  provider_last_event_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (provider_key, external_reservation_id)
);

create table if not exists ota_sync_cursor (
  provider_key text not null,
  connection_id uuid references ota_connection(id) on delete cascade,
  mode text not null,
  cursor_value text,
  last_synced_at timestamptz,
  updated_at timestamptz not null,
  primary key (provider_key, connection_id, mode)
);

create table if not exists ota_sync_run (
  id uuid primary key,
  provider_key text not null,
  connection_id uuid references ota_connection(id) on delete set null,
  mode text not null,
  status text not null,
  summary jsonb,
  error_message text,
  started_at timestamptz not null,
  finished_at timestamptz
);

create unique index if not exists idx_ota_sync_run_identity
  on ota_sync_run (provider_key, connection_id, mode, started_at);

create table if not exists ota_event_log (
  id uuid primary key,
  provider_key text not null,
  connection_id uuid references ota_connection(id) on delete set null,
  reservation_id uuid references reservation(id) on delete set null,
  external_reservation_id text,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null
);
