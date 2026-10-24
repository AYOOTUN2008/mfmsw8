-- Run in the Supabase SQL editor. Re-running this migration preserves content.
begin;
create table if not exists public.cms_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.cms_admins enable row level security;
create or replace function public.is_cms_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.cms_admins where user_id = auth.uid()); $$;
revoke all on function public.is_cms_admin() from public;
grant execute on function public.is_cms_admin() to anon, authenticated;
revoke all on public.cms_admins from anon, authenticated;
grant select on public.cms_admins to authenticated;
drop policy if exists "Administrators see their own membership" on public.cms_admins;
create policy "Administrators see their own membership" on public.cms_admins for select to authenticated using (user_id = auth.uid());

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event','service','announcement','sermon','ministry','gallery','leader')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 10000),
  image_url text not null default '' check (char_length(image_url) <= 2048 and (image_url = '' or image_url ~ '^https://[^/@[:space:]]+' or image_url ~ '^/media/[A-Za-z0-9._/-]+$' or image_url ~ '^storage://church-media/uploads/[a-f0-9-]+\.(webp|jpg|jpeg|png)$')),
  date date,
  time text not null default '' check (char_length(time) <= 80),
  location text not null default '' check (char_length(location) <= 500),
  speaker text not null default '' check (char_length(speaker) <= 160),
  video_url text not null default '' check (char_length(video_url) <= 2048 and (video_url = '' or video_url ~ '^https://[^/@[:space:]]+')),
  audio_url text not null default '' check (char_length(audio_url) <= 2048 and (audio_url = '' or audio_url ~ '^https://[^/@[:space:]]+')),
  category text not null default '' check (char_length(category) <= 120),
  published boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order between -10000 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'gallery' or image_url <> ''),
  check (not published or kind <> 'event' or date is not null),
  check (not published or kind <> 'service' or (category <> '' and time <> '')),
  check (not published or kind <> 'sermon' or video_url <> '' or audio_url <> '')
);
create index if not exists content_items_published_kind on public.content_items(kind, sort_order) where published;
alter table public.content_items enable row level security;
revoke all on public.content_items from anon, authenticated;
grant select on public.content_items to anon, authenticated;
grant insert, update, delete on public.content_items to authenticated;
drop policy if exists "Public reads published content" on public.content_items;
create policy "Public reads published content" on public.content_items for select to anon, authenticated using (published or public.is_cms_admin());
drop policy if exists "Administrators create content" on public.content_items;
create policy "Administrators create content" on public.content_items for insert to authenticated with check (public.is_cms_admin());
drop policy if exists "Administrators update content" on public.content_items;
create policy "Administrators update content" on public.content_items for update to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists "Administrators delete content" on public.content_items;
create policy "Administrators delete content" on public.content_items for delete to authenticated using (public.is_cms_admin());

create or replace function public.valid_cms_settings(value jsonb) returns boolean
language sql immutable set search_path = ''
as $$
select jsonb_typeof(value) = 'object' and not exists (
  select 1 from jsonb_each(value) e where
    e.key not in ('hero_heading','hero_subheading','hero_cta','welcome_text','contact_address','contact_phone','contact_email','maps_url','youtube_url','facebook_url','instagram_url','telegram_url','audiomack_url')
    or jsonb_typeof(e.value) <> 'string'
    or char_length(e.value #>> '{}') > case e.key when 'hero_heading' then 200 when 'hero_subheading' then 500 when 'hero_cta' then 60 when 'welcome_text' then 3000 when 'contact_address' then 500 when 'contact_phone' then 80 when 'contact_email' then 254 else 2048 end
    or (e.key like '%\_url' escape '\' and (e.value #>> '{}') <> '' and (e.value #>> '{}') !~ '^https://[^/@[:space:]]+')
);
$$;
create table if not exists public.site_settings (
  id text primary key default 'home' check (id = 'home'),
  data jsonb not null default '{}'::jsonb check (public.valid_cms_settings(data)),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
drop policy if exists "Public reads page settings" on public.site_settings;
create policy "Public reads page settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Administrators add page settings" on public.site_settings;
create policy "Administrators add page settings" on public.site_settings for insert to authenticated with check (public.is_cms_admin());
drop policy if exists "Administrators edit page settings" on public.site_settings;
create policy "Administrators edit page settings" on public.site_settings for update to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
insert into public.site_settings(id) values ('home') on conflict do nothing;

create or replace function public.cms_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists content_items_touch_updated_at on public.content_items;
create trigger content_items_touch_updated_at before update on public.content_items for each row execute function public.cms_touch_updated_at();
drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at before update on public.site_settings for each row execute function public.cms_touch_updated_at();

-- Draft photos stay private. Only objects referenced by published rows can be signed by visitors.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('church-media','church-media',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Published photos or administrator access" on storage.objects;
create policy "Published photos or administrator access" on storage.objects for select to anon, authenticated
using (bucket_id = 'church-media' and (public.is_cms_admin() or exists (
  select 1 from public.content_items i where i.published and i.image_url = 'storage://church-media/' || name
)));
drop policy if exists "Administrators upload church images" on storage.objects;
create policy "Administrators upload church images" on storage.objects for insert to authenticated
with check (bucket_id = 'church-media' and public.is_cms_admin() and name ~ '^uploads/[a-f0-9-]+\.(webp|jpg|jpeg|png)$');
drop policy if exists "Administrators delete unused church images" on storage.objects;
create policy "Administrators delete unused church images" on storage.objects for delete to authenticated
using (bucket_id = 'church-media' and public.is_cms_admin() and not exists (
  select 1 from public.content_items i where i.image_url = 'storage://church-media/' || name
));
commit;
