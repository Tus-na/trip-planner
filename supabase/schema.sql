create table public.profiles (
  id uuid not null,
  full_name text null,
  avatar_url text null,
  role text null,
  assigned_role text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_role_check check (
    (role = any (array['LEAD'::text, 'MEMBER'::text]))
  )
) TABLESPACE pg_default;

create view public.profiles_with_email
with
  (security_invoker = true) as
select
  p.id,
  p.full_name,
  p.role,
  p.assigned_role,
  u.email
from
  profiles p
  join auth.users u on p.id = u.id;

create table public.events (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  description text null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text null,
  category text null,
  approval_status text null default 'PENDING'::text,
  status text null default 'UPCOMING'::text,
  cost numeric null default 0,
  payer_id uuid null,
  created_by uuid null,
  assigned_members uuid[] null,
  created_at timestamp with time zone null default now(),
  order_index integer null,
  constraint events_pkey primary key (id),
  constraint events_created_by_fkey foreign KEY (created_by) references profiles (id) on delete CASCADE,
  constraint events_payer_id_fkey foreign KEY (payer_id) references profiles (id) on delete set null,
  constraint events_approval_status_check check (
    (
      approval_status = any (
        array[
          'PENDING'::text,
          'APPROVED'::text,
          'REJECTED'::text
        ]
      )
    )
  ),
  constraint events_status_check check (
    (
      status = any (
        array[
          'UPCOMING'::text,
          'IN_PROGRESS'::text,
          'COMPLETED'::text,
          'DELAYED'::text,
          'CANCELLED'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;