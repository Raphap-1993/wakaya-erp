create table if not exists bungalow_unit (
  id text primary key,
  bungalow_id text not null references bungalow(id),
  code text not null unique,
  name text not null,
  active boolean not null default true,
  sort_order integer not null,
  notes text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bungalow_unit_block (
  id uuid primary key,
  unit_id text not null references bungalow_unit(id),
  start_date date not null,
  end_date date not null,
  reason_code text not null,
  notes text,
  status text not null default 'active',
  created_by text,
  created_at timestamptz not null default now(),
  cancelled_by text,
  cancelled_at timestamptz,
  cancel_reason text,
  check (start_date < end_date)
);

alter table reservation add column if not exists bungalow_unit_id text references bungalow_unit(id);
alter table reservation_occupancy add column if not exists bungalow_unit_id text references bungalow_unit(id);

alter table reservation_occupancy drop constraint if exists reservation_occupancy_bungalow_id_date_key;

create unique index if not exists reservation_occupancy_unit_night_uq
  on reservation_occupancy (bungalow_unit_id, date)
  where status <> 'released' and bungalow_unit_id is not null;

create unique index if not exists availability_conflict_open_assignment_uq
  on availability_conflict (reservation_id, conflict_type)
  where status = 'open' and reservation_id is not null and conflict_type = 'assignment_overlap';
