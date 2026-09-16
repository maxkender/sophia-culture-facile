create table public.ai_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  content_hash text not null,
  model text not null,
  result jsonb not null,
  shared_with_author boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index ai_reviews_course_idx on public.ai_reviews (course_id, created_at desc);

grant select, insert, update, delete on public.ai_reviews to authenticated;
grant all on public.ai_reviews to service_role;

alter table public.ai_reviews enable row level security;

create policy ai_reviews_select on public.ai_reviews for select to authenticated
using (
  private.is_admin()
  or (
    shared_with_author
    and exists (select 1 from public.courses c where c.id = ai_reviews.course_id and c.author_id = private.profile_id())
  )
);

create policy ai_reviews_insert on public.ai_reviews for insert to authenticated
with check (private.is_admin());

create policy ai_reviews_update on public.ai_reviews for update to authenticated
using (private.is_admin()) with check (private.is_admin());

create policy ai_reviews_delete on public.ai_reviews for delete to authenticated
using (private.is_admin());