alter table public.courses
  add column if not exists language text not null default 'fr',
  add column if not exists alternate_slug text;

alter table public.courses drop constraint if exists courses_language_check;
alter table public.courses add constraint courses_language_check check (language in ('fr','en'));

create index if not exists courses_language_idx on public.courses (language);