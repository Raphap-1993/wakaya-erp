create table if not exists backoffice_user (
  id uuid primary key,
  email text not null,
  name text not null,
  password_hash text not null,
  roles jsonb not null default '["admin"]'::jsonb,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index if not exists idx_backoffice_user_email_lower
  on backoffice_user (lower(email));

create table if not exists backoffice_session (
  id uuid primary key,
  user_id uuid not null references backoffice_user(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null,
  last_seen_at timestamptz not null
);

create index if not exists idx_backoffice_session_user_expires
  on backoffice_session (user_id, expires_at desc);
