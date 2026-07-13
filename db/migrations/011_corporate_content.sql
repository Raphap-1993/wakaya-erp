create table if not exists corporate_content_revision (
  version bigserial primary key,
  document jsonb not null,
  published_by_user_id text,
  restored_from_version bigint references corporate_content_revision(version),
  created_at timestamptz not null default now()
);

create index if not exists corporate_content_revision_created_at_idx
  on corporate_content_revision (created_at desc);
