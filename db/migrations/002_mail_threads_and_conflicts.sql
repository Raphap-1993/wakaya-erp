alter table booking_request
  add column if not exists thread_key text;

update booking_request
set thread_key = concat('booking-request:', public_ref)
where thread_key is null;

create unique index if not exists idx_booking_request_thread_key
  on booking_request (thread_key);

alter table availability_conflict
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists message_thread (
  id uuid primary key,
  mailbox_address text not null,
  provider text not null,
  provider_thread_id text,
  subject text,
  thread_key text not null unique,
  linked_entity_type text not null,
  linked_entity_id uuid not null,
  last_synced_at timestamptz,
  sync_status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index if not exists idx_message_thread_provider_thread_id
  on message_thread (provider_thread_id)
  where provider_thread_id is not null;

create table if not exists message_item (
  id uuid primary key,
  thread_id uuid not null references message_thread(id) on delete cascade,
  direction text not null,
  provider_message_id text not null unique,
  from_address text not null,
  to_addresses jsonb not null default '[]'::jsonb,
  cc_addresses jsonb not null default '[]'::jsonb,
  subject text not null,
  body_text text,
  body_html text,
  sent_at timestamptz,
  received_at timestamptz,
  ingested_at timestamptz not null
);

create index if not exists idx_message_item_thread_id
  on message_item (thread_id, ingested_at desc);

create table if not exists message_attachment (
  id uuid primary key,
  message_id uuid not null references message_item(id) on delete cascade,
  provider_attachment_id text,
  file_name text not null,
  content_type text not null,
  file_size_bytes integer not null default 0,
  storage_key text not null,
  file_hash text not null,
  is_supported boolean not null default false,
  content_base64 text,
  created_at timestamptz not null,
  unique (message_id, file_hash)
);

create index if not exists idx_message_attachment_message_id
  on message_attachment (message_id);
