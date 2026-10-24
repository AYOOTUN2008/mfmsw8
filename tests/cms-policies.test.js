import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// PostgreSQL emulation of database authorization, not a replacement for checking
// the real Supabase Auth, REST, and Storage services during project connection.
const admin = '11111111-1111-1111-1111-111111111111';
const regularUser = '22222222-2222-2222-2222-222222222222';
const draftPath = 'uploads/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp';
const publishedPath = 'uploads/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.webp';
const unusedPath = 'uploads/cccccccc-cccc-cccc-cccc-cccccccccccc.webp';
let db;
let migration;

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    -- Supabase commonly grants broad privileges on new public tables. The
    -- migration must revoke them explicitly because RLS does not cover TRUNCATE.
    alter default privileges in schema public grant all on tables to anon, authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    grant usage on schema auth, storage, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets(
      id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects(
      id uuid primary key default gen_random_uuid(), bucket_id text, name text
    );
    alter table storage.objects enable row level security;
    grant select, insert, delete on storage.objects to anon, authenticated;
    insert into auth.users values ('${admin}'), ('${regularUser}');
  `);
  migration = await readFile(new URL('../supabase/migrations/202610240001_church_cms.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(`
    insert into public.cms_admins(user_id) values ('${admin}');
    insert into public.content_items(id,kind,title,image_url,published) values
      ('33333333-3333-3333-3333-333333333333','announcement','Draft','storage://church-media/${draftPath}',false),
      ('44444444-4444-4444-4444-444444444444','announcement','Published','storage://church-media/${publishedPath}',true);
    insert into storage.objects(bucket_id,name) values
      ('church-media','${draftPath}'),('church-media','${publishedPath}');
  `);
}, { timeout: 15000 });

after(async () => { await db?.close(); });

async function as(role, userId, query) {
  await db.exec('begin');
  try {
    await db.exec(`set local role ${role}; select set_config('request.jwt.claim.sub','${userId}',true);`);
    const result = await db.query(query);
    await db.exec('commit');
    return result;
  } catch (error) {
    await db.exec('rollback');
    throw error;
  }
}
async function denied(role, userId, query, expectedCode = '42501') {
  await assert.rejects(as(role, userId, query), error => error.code === expectedCode);
}
async function cannotAffectRows(role, userId, query) {
  try {
    const result = await as(role, userId, query);
    assert.equal(result.rows.length, 0);
  } catch (error) {
    assert.equal(error.code, '42501', 'Only a permission denial is an acceptable alternative to zero changed rows');
  }
}

test('CMS migration re-runs without deleting existing content or approved staff', async () => {
  await db.exec(migration);
  assert.equal((await db.query('select count(*)::int as count from public.content_items')).rows[0].count, 2);
  assert.equal((await db.query('select count(*)::int as count from public.cms_admins')).rows[0].count, 1);
});

test('CMS storage bucket is private with an image MIME allowlist and 5 MiB limit', async () => {
  const bucket = (await db.query("select * from storage.buckets where id='church-media'")).rows[0];
  assert.equal(bucket.public, false);
  assert.equal(Number(bucket.file_size_limit), 5242880);
  assert.deepEqual(bucket.allowed_mime_types, ['image/jpeg', 'image/png', 'image/webp']);
});

for (const [role, userId, label] of [
  ['anon', '', 'anonymous visitor'],
  ['authenticated', regularUser, 'unapproved authenticated user'],
  ['authenticated', admin, 'approved administrator'],
]) {
  test(`${label} has no TRUNCATE privilege despite broad default grants`, async () => {
    const result = await as(role, userId, `select
      has_table_privilege(current_user, 'public.content_items', 'TRUNCATE') as content,
      has_table_privilege(current_user, 'public.site_settings', 'TRUNCATE') as settings`);
    assert.deepEqual(result.rows, [{ content: false, settings: false }]);
  });
}

for (const [role, userId, label] of [['anon', '', 'anonymous visitor'], ['authenticated', regularUser, 'unapproved authenticated user']]) {
  test(`${label} reads only published content`, async () => {
    const result = await as(role, userId, 'select title from public.content_items order by title');
    assert.deepEqual(result.rows, [{ title: 'Published' }]);
  });
  test(`${label} cannot insert content`, () => denied(role, userId, "insert into public.content_items(kind,title) values('announcement','Unapproved')"));
  test(`${label} cannot update content`, () => cannotAffectRows(role, userId, "update public.content_items set title='Tampered' where title='Published' returning id"));
  test(`${label} cannot delete content`, () => cannotAffectRows(role, userId, "delete from public.content_items where title='Published' returning id"));
  test(`${label} cannot enroll as an administrator`, () => denied(role, userId, `insert into public.cms_admins(user_id) values('${regularUser}')`));
  test(`${label} can access published-image objects but not draft-image objects`, async () => {
    const result = await as(role, userId, "select name from storage.objects where bucket_id='church-media'");
    assert.deepEqual(result.rows, [{ name: publishedPath }]);
  });
  test(`${label} cannot upload an image`, () => denied(role, userId, `insert into storage.objects(bucket_id,name) values('church-media','${unusedPath}')`));
  test(`${label} cannot delete images`, () => cannotAffectRows(role, userId, "delete from storage.objects where bucket_id='church-media' returning id"));
  test(`${label} cannot change page settings`, () => cannotAffectRows(role, userId, "update public.site_settings set data='{\"hero_heading\":\"Tampered\"}' where id='home' returning id"));
}

test('approved administrator can read private drafts', async () => {
  const result = await as('authenticated', admin, 'select title from public.content_items order by title');
  assert.deepEqual(result.rows, [{ title: 'Draft' }, { title: 'Published' }]);
});
test('approved administrator can create a draft', async () => {
  const result = await as('authenticated', admin, "insert into public.content_items(kind,title) values('announcement','Admin draft') returning published");
  assert.deepEqual(result.rows, [{ published: false }]);
});
test('approved administrator can update public page settings', async () => {
  const result = await as('authenticated', admin, "update public.site_settings set data='{\"hero_heading\":\"Approved change\"}' where id='home' returning data");
  assert.deepEqual(result.rows, [{ data: { hero_heading: 'Approved change' } }]);
});
test('database rejects unknown settings keys', () => denied('authenticated', admin, "update public.site_settings set data='{\"unknown_key\":\"Oops\"}' where id='home'", '23514'));
test('approved administrator cannot delete an image referenced by a draft', () => cannotAffectRows('authenticated', admin, `delete from storage.objects where bucket_id='church-media' and name='${draftPath}' returning id`));
test('approved administrator can upload an allowed image path', async () => {
  const result = await as('authenticated', admin, `insert into storage.objects(bucket_id,name) values('church-media','${unusedPath}') returning name`);
  assert.deepEqual(result.rows, [{ name: unusedPath }]);
});
test('approved administrator can delete an unused image', async () => {
  const result = await as('authenticated', admin, `delete from storage.objects where name='${unusedPath}' returning name`);
  assert.deepEqual(result.rows, [{ name: unusedPath }]);
});
test('database upload policy rejects SVG or arbitrary file extensions', () => denied('authenticated', admin, "insert into storage.objects(bucket_id,name) values('church-media','uploads/unsafe.svg')"));
test('unpublishing content removes anonymous object access', async () => {
  await as('authenticated', admin, "update public.content_items set published=false where title='Published'");
  assert.deepEqual((await as('anon', '', "select name from storage.objects where bucket_id='church-media'")).rows, []);
});
