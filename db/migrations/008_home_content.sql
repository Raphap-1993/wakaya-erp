create table if not exists home_content_revision (
  version integer generated always as identity primary key,
  document jsonb not null,
  published_by_user_id text,
  restored_from_version integer references home_content_revision(version),
  created_at timestamptz not null default now()
);

create index if not exists home_content_revision_created_at_idx
  on home_content_revision (created_at desc);
