-- Run once in the Supabase SQL Editor before deploying the web changes.
begin;

alter table public.profiles
  add column if not exists acquisition_source text
  check (acquisition_source in ('facebook', 'tiktok', 'other'));

create or replace function public.capture_profile_acquisition_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_source text;
begin
  select raw_user_meta_data ->> 'acquisition_source' into signup_source
  from auth.users where id = new.id;

  new.acquisition_source := case
    when signup_source in ('facebook', 'tiktok', 'other') then signup_source
    else null
  end;
  return new;
end;
$$;

drop trigger if exists capture_profile_acquisition_source on public.profiles;
create trigger capture_profile_acquisition_source
before insert on public.profiles
for each row execute function public.capture_profile_acquisition_source();

commit;
