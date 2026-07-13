create table if not exists complaint_case (
  id uuid primary key,
  public_code text not null unique,
  type text not null,
  status text not null,
  full_name text not null,
  document_type text not null,
  document_number text not null,
  email text not null,
  phone text,
  address text,
  service_type text,
  contracted_service text,
  complaint_detail text not null,
  consumer_request text not null,
  accepted_declaration boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_complaint_case_status_updated_at
  on complaint_case (status, updated_at desc);

create index if not exists idx_complaint_case_created_at
  on complaint_case (created_at desc);
