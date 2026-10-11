create table public.inspirations (
  id uuid primary key default gen_random_uuid(),
  app_id uuid,
  batch_id uuid,
  url text not null,
  norm_key text not null unique,
  platform text not null,
  kind text not null default 'video',
  status text not null default 'queued',
  attempts int not null default 0,
  error text,
  next_try_at timestamptz not null default now(),
  author_handle text, caption text, hashtags text[] not null default '{}',
  cover_path text, video_path text, duration_s numeric,
  views bigint, likes bigint, comments bigint, shares bigint, posted_at timestamptz,
  transcript text, language text, words jsonb,
  analysis jsonb, proposed_style text, style_confidence numeric, approved_style text,
  hook_text text, hook_type text, score int, app_fit text, tags text[] not null default '{}',
  cost jsonb not null default '{}'::jsonb,
  reference_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inspirations_status_idx on public.inspirations(status, next_try_at);
create index inspirations_batch_idx on public.inspirations(batch_id);
grant select, insert, update, delete on public.inspirations to authenticated;
grant all on public.inspirations to service_role;
alter table public.inspirations enable row level security;
create policy inspirations_admin_all on public.inspirations for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy inspirations_admin_read on storage.objects for select to authenticated using (bucket_id = 'inspirations' and private.is_admin());