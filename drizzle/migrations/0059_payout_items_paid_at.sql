alter table public.payout_items add column if not exists paid_at timestamptz;
create or replace function public.stamp_payout_item_paid() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' and new.paid_at is null then new.paid_at := now(); end if;
  return new;
end $$;
drop trigger if exists stamp_payout_item_paid on public.payout_items;
create trigger stamp_payout_item_paid before update on public.payout_items for each row execute function public.stamp_payout_item_paid();
create or replace function public.mark_posts_paid() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    update public.creator_posts set pay_status = 'paid' where payout_item_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists mark_posts_paid on public.payout_items;
create trigger mark_posts_paid after update on public.payout_items for each row execute function public.mark_posts_paid();