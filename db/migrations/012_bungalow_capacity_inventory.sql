do $$
declare
  mismatch text;
begin
  select string_agg(expected.bungalow_id || ': expected ' || expected.total_units || ', found ' || expected.actual_units, '; ')
  into mismatch
  from (
    select blueprint.bungalow_id, blueprint.total_units, count(legacy.id)::integer as actual_units
    from (values
      ('bungalow-family', 5),
      ('bungalow-matrimonial', 4),
      ('bungalow-individual', 5),
      ('bungalow-suite', 2),
      ('bungalow-triple', 1)
    ) as blueprint(bungalow_id, total_units)
    left join bungalow_unit legacy
      on legacy.bungalow_id = blueprint.bungalow_id
     and legacy.active = true
    group by blueprint.bungalow_id, blueprint.total_units
    having count(legacy.id)::integer <> blueprint.total_units
  ) expected;

  if mismatch is not null then
    raise exception 'bungalow_capacity_legacy_count_mismatch: %', mismatch;
  end if;
end
$$;

create table if not exists bungalow_capacity (
  bungalow_id text primary key references bungalow(id),
  total_units integer not null check (total_units >= 0),
  version integer not null default 1,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bungalow_capacity_block (
  id uuid primary key,
  bungalow_id text not null references bungalow(id),
  quantity integer not null check (quantity > 0),
  start_date date not null,
  end_date date not null,
  reason_code text not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_by text,
  created_at timestamptz not null default now(),
  cancelled_by text,
  cancelled_at timestamptz,
  cancel_reason text,
  legacy_unit_block_id uuid unique,
  check (start_date < end_date)
);

insert into bungalow_capacity (bungalow_id, total_units, version, updated_by)
values
  ('bungalow-family', 5, 1, 'migration-012'),
  ('bungalow-matrimonial', 4, 1, 'migration-012'),
  ('bungalow-individual', 5, 1, 'migration-012'),
  ('bungalow-suite', 2, 1, 'migration-012'),
  ('bungalow-triple', 1, 1, 'migration-012')
on conflict (bungalow_id) do nothing;

insert into bungalow_capacity_block (
  id,
  bungalow_id,
  quantity,
  start_date,
  end_date,
  reason_code,
  notes,
  status,
  created_by,
  created_at,
  cancelled_by,
  cancelled_at,
  cancel_reason,
  legacy_unit_block_id
)
select
  legacy_block.id,
  legacy_unit.bungalow_id,
  1,
  legacy_block.start_date,
  legacy_block.end_date,
  legacy_block.reason_code,
  legacy_block.notes,
  legacy_block.status,
  legacy_block.created_by,
  legacy_block.created_at,
  legacy_block.cancelled_by,
  legacy_block.cancelled_at,
  legacy_block.cancel_reason,
  legacy_block.id
from bungalow_unit_block legacy_block
inner join bungalow_unit legacy_unit on legacy_unit.id = legacy_block.unit_id
on conflict (legacy_unit_block_id) do nothing;

create index if not exists bungalow_capacity_block_active_range_idx
  on bungalow_capacity_block (bungalow_id, start_date, end_date)
  where status = 'active';
