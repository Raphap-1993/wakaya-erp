alter table if exists booking_request
  add column if not exists owner_user_id text;

alter table if exists booking_request
  add column if not exists owner_assigned_at timestamptz;

create index if not exists idx_booking_request_owner_status_updated_at
  on booking_request (owner_user_id, status, updated_at desc);

alter table if exists message_item
  add column if not exists origin text;

update message_item
set origin = case
  when direction = 'inbound' then 'guest_inbound'
  else 'system_outbound'
end
where origin is null;

alter table if exists message_item
  alter column origin set not null;

alter table if exists message_item
  add column if not exists created_by_user_id text;

create table if not exists quick_reply_template (
  id uuid primary key,
  key text not null unique,
  label text not null,
  category text not null,
  subject_mode text not null,
  body_text text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_by_user_id text,
  updated_at timestamptz not null
);

create index if not exists idx_quick_reply_template_active_sort
  on quick_reply_template (is_active, sort_order asc, label asc);

insert into quick_reply_template (
  id, key, label, category, subject_mode, body_text,
  is_active, sort_order, updated_by_user_id, updated_at
) values
  (
    '0f6fdc60-8ed8-4f3b-9558-3cc6f5d2f101',
    'proof_followup',
    'Seguimiento de comprobante',
    'Cobranza',
    'keep_thread_subject',
    'Hola {{guestName}}, recibimos tu solicitud {{publicRef}}. Cuando tengas el comprobante, respóndelo por este mismo hilo para validar las fechas {{checkIn}} → {{checkOut}}.',
    true,
    10,
    'system',
    now()
  ),
  (
    '0f6fdc60-8ed8-4f3b-9558-3cc6f5d2f102',
    'reschedule_offer',
    'Propuesta de reprogramación',
    'Conflictos',
    'keep_thread_subject',
    'Hola {{guestName}}, detectamos un cruce operativo para {{requestedBungalowType}}. Podemos ayudarte a mover la solicitud {{publicRef}} sin perder seguimiento.',
    true,
    20,
    'system',
    now()
  ),
  (
    '0f6fdc60-8ed8-4f3b-9558-3cc6f5d2f103',
    'payment_confirmed',
    'Confirmación de validación',
    'Operación',
    'keep_thread_subject',
    'Hola {{guestName}}, ya validamos tu comprobante para {{publicRef}}. Seguimos por este mismo hilo con cualquier ajuste sobre {{checkIn}} → {{checkOut}}.',
    true,
    30,
    'system',
    now()
  )
on conflict (key) do nothing;
