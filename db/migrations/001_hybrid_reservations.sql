create table if not exists bungalow (
  id text primary key,
  code text not null unique,
  name text not null,
  active boolean not null default true,
  capacity integer not null
);

create table if not exists reservation (
  id uuid primary key,
  number text not null unique,
  channel text not null,
  status text not null,
  source_request_id uuid unique,
  bungalow_id text references bungalow(id),
  responsible_id text,
  start_date date not null,
  end_date date not null,
  amount_total_cents integer,
  amount_paid_cents integer,
  payment_status text,
  currency_code text,
  updated_at timestamptz not null
);

create table if not exists reservation_occupancy (
  id uuid primary key,
  reservation_id uuid not null references reservation(id) on delete cascade,
  bungalow_id text not null references bungalow(id),
  date date not null,
  source text not null,
  status text not null,
  created_at timestamptz not null,
  unique (bungalow_id, date)
);

create table if not exists reservation_audit (
  id uuid primary key,
  reservation_id uuid not null references reservation(id) on delete cascade,
  actor_id text not null,
  action text not null,
  previous_status text not null,
  next_status text not null,
  reason text not null,
  created_at timestamptz not null
);

create table if not exists booking_request (
  id uuid primary key,
  public_ref text not null unique,
  status text not null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  requested_check_in date not null,
  requested_check_out date not null,
  requested_guests integer not null,
  requested_bungalow_type text,
  source_channel text not null default 'web_public',
  thread_id uuid,
  notes text,
  last_message_at timestamptz,
  sync_status text not null default 'pending',
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists availability_conflict (
  id uuid primary key,
  status text not null,
  conflict_type text not null,
  request_id uuid references booking_request(id) on delete cascade,
  reservation_id uuid references reservation(id) on delete cascade,
  notes text,
  created_by text,
  resolved_by text,
  created_at timestamptz not null,
  resolved_at timestamptz
);

create table if not exists outbound_email (
  id uuid primary key,
  event_type text not null,
  linked_entity_type text not null,
  linked_entity_id uuid not null,
  idempotency_key text not null unique,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_reservation_status_updated_at
  on reservation (status, updated_at desc);

create index if not exists idx_reservation_responsible_updated_at
  on reservation (responsible_id, updated_at desc);

create index if not exists idx_occupancy_reservation
  on reservation_occupancy (reservation_id);

create index if not exists idx_audit_reservation_created_at
  on reservation_audit (reservation_id, created_at desc);
