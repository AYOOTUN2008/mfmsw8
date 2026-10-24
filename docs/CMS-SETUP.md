# Connect the MFM SW8 church office

The public website runs without Supabase. `/admin.html` (also `/admin` on Vercel) shows a setup screen until the following connection is complete. There is no built-in password, fake login, or public staff registration.

The repository contains a working CMS integration, not an already provisioned backend. Database, live authentication, production storage, and authorization checks must be verified against the church's actual project before staff use.

## 1. Create a church-controlled Supabase project

Use a church-controlled account and keep recovery information with the church. Enable email/password authentication. Turn off **Allow new users to sign up** in Authentication settings so visitors cannot self-register. Set the Auth **Site URL** to the full deployed office entry, for example `https://YOUR_DOMAIN/admin.html` (replace the domain; do not keep this example). Add that exact URL under **Redirect URLs**. For local development, separately allow `http://localhost:5173/admin.html` if you use that origin. Avoid broad wildcard production redirect rules. The public website remains at `/`; the Auth Site URL is the callback destination for account emails. Keep database passwords and service-role/secret keys private; they do not belong in the frontend or in chat.

## 2. Create the database and media policies

Run the complete contents of `supabase/migrations/202610240001_church_cms.sql` in the project's SQL editor. It can be rerun without deleting content.

This creates:

- `content_items`: programmes, service times, announcements, messages, ministries, gallery, and leadership. Every item starts as a draft. Public requests explicitly select published rows; RLS also enforces this.
- `site_settings`: one public `home` record for homepage wording, confirmed contact details, and social URLs. Saving these page settings publishes them immediately. They do not contain secrets and do not have a separate draft state.
- `cms_admins`: the approved account list. Staff cannot add themselves or other staff from the browser.
- A **private** `church-media` Storage bucket. Uploads are limited to JPEG, PNG and WebP, 5 MB maximum; the browser resizes photographs to at most 1,800 pixels on the longest edge. Gallery and other content references are stored as `storage://church-media/uploads/...`, not image binaries.

Storage policies allow only approved staff to upload/delete. Anonymous visitors can request signed links only for images referenced by a published content item. Signed image URLs expire after one hour; previously issued URLs may remain usable until expiry after an item is unpublished. Draft images without a prior public signed URL remain private. File deletion is blocked while any content item references it. Remove that reference first, then delete the unused photograph in Photo library.

Review any pre-existing policies on these tables or `storage.objects`. PostgreSQL permissive policies combine with OR, so unrelated broad policies must not grant access to the `church-media` bucket or these tables. Prefer a dedicated project if the existing policy setup is unknown.

## 3. Add approved staff accounts

Invite each staff account through **Supabase Authentication → Users → Invite user**. Supabase’s default invitation email redirects to the configured `/admin.html` Site URL. Keep the standard Supabase confirmation URL in the email template; do not replace it with an unsupported custom token endpoint. The admin page accepts the standard implicit callback fragment, lets Supabase verify it, and shows a password-and-confirmation form for invitation or password recovery sessions. Set a password of at least 12 characters; after saving, the page signs the user out so they can sign in with that password. The form shows the account email to avoid changing the wrong account. URL tokens are removed after the SDK has processed them; no application copy of the token is saved outside Supabase’s normal session handling. Once the account exists, copy its user UUID and run:

```sql
insert into public.cms_admins (user_id)
values ('REPLACE_WITH_AUTH_USER_UUID')
on conflict do nothing;
```

Use the UUID from Authentication, not an email address. Do not put passwords into SQL or this repository. To revoke access, remove that UUID from `cms_admins`; revoke sessions in Authentication if the account is compromised. A login by an account without membership shows “Staff access needed” and RLS denies content mutations.

## 4. Connect the Vercel build

Add these variables in **Vercel Project → Settings → Environment Variables** for the relevant environment(s):

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

The project URL and publishable/anon key are intended to be public. Obtain them from the project API settings. **Never substitute a service-role key, `sb_secret_...` key, database password, or another private credential.** RLS and storage policies provide the authorization boundary.

Redeploy after adding or changing Vite environment variables; they are compiled into the build. For local development, copy `.env.example` to `.env.local`, fill in the same public values, and restart Vite. Keep `.env.local` ignored. The root public website and admin page use the same project configuration.

If onboarding network restrictions are in use, allow HTTPS to the exact Supabase project hostname. Do not replace an unknown domain allowlist.

## 5. Import the supplied verified content (optional)

When the live backend is configured, **empty collections stay empty**. Unpublishing an item must not make a built-in fallback reappear. Before connection, the site uses the supplied verified archive photos and leadership text; import them if they should remain visible after connection.

The following optional SQL imports only already supplied, verified information and local media included in the build. No event dates, schedules, contacts, ministry departments, or social profile URLs are invented. Review before running. Fixed IDs make it repeatable without duplicating items; existing rows with these IDs are preserved.

```sql
insert into public.content_items (id, kind, title, description, category, image_url, published, sort_order)
values
('53adaf7a-17cf-40d0-bbfb-f213ff5c0001', 'leader', 'Pastor Japheth Otujinrin', 'M.R.O. · Ijebu/Remo Mega-Regional Headquarters. Name and designation supplied in the regional ministry materials.', 'M.R.O.', '', true, 0),
('53adaf7a-17cf-40d0-bbfb-f213ff5c0002', 'gallery', 'Together in worship', 'Congregation gathered inside the regional church during a service. From our regional media archive.', 'Regional archive', '/media/regional-congregation.webp', true, 0),
('53adaf7a-17cf-40d0-bbfb-f213ff5c0003', 'gallery', 'A grateful family', 'Church members sharing a moment of thanksgiving near the altar. From our regional media archive.', 'Regional archive', '/media/regional-thanksgiving.webp', true, 1),
('53adaf7a-17cf-40d0-bbfb-f213ff5c0004', 'gallery', 'United in prayer', 'Members of the regional church gathered for prayer. From our regional media archive.', 'Regional archive', '/media/regional-prayer.webp', true, 2)
on conflict (id) do nothing;
```

These files remain local public assets; the private upload rules apply to new CMS uploads. All existing media was supplied for public website use. Local assets cannot be removed through the CMS media library; change their content references or replace them by uploading new photos.

## 6. Verify access before handing over

Use the production deployment or a preview connected to a separate staging project. Check all of the following:

1. A signed-out visit to `/admin.html` shows the staff login, without content controls. A regular Auth user without `cms_admins` membership cannot manage content.
2. An approved account can log in, create a programme draft, upload a photograph, and save it. The draft and its private image must be inaccessible to a signed-out browser. Check the Storage object path, not the approved user's signed preview URL (which is a bearer URL valid for one hour).
3. Publish the item. It appears on the public website with its image. Unpublish it. It disappears; no old fallback event appears. Reload the public page when checking.
4. Try direct anonymous writes through the Supabase API and confirm denial. Checking only the hidden dashboard is insufficient. Also verify a non-admin authenticated account is denied write access.
5. Change a page text field, publish page changes, and check the public page. Clear the field to restore the configured default wording. Contact/social fields stay absent when blank.
6. Delete a draft. Check its image remains in the library, and delete the now-unused image there. Attempting to delete an image referenced by another draft or published item must be denied.
7. Send a real staff invitation. Follow the email to `/admin.html`, set and confirm a password, and verify successful sign-out and subsequent password login. Try an expired link and confirm it cannot open the CMS.
8. From login, select **Forgot your password?**, request a link, and follow the real email. It must open the password form, clear callback tokens from the URL, save the confirmed password, and sign out. Resetting a non-admin account must not grant CMS access.
9. Sign out and confirm controls disappear. Test with a real staff phone as well as desktop.

Do not claim live backend readiness until these checks pass. Static code/browser checks without a project verify the setup screen and frontend integration, not real Supabase policies or email delivery.

## Staff workflow

- **Overview:** current published counts and quick actions.
- **Programmes / announcements / messages / services / ministries / gallery / leadership:** Add → enter confirmed details → preview content → Save draft or Save & publish. Edit or unpublish any item later. Confirm before deletion.
- **Page text & contact:** edit only the words and verified contact/social links; design and layout remain protected. Saving publishes immediately.
- **Photo library:** upload images, copy their reference, and use it in any content photograph field. Uploads have progress and visible errors. Images uploaded from a content editor are automatically attached to that item once saved.
- **Video:** use secure YouTube or other media URLs. Large video hosting/uploads are intentionally omitted to keep costs and mobile loading manageable.
- **Push notifications:** not implemented in this phase. A later addition needs HTTPS, explicit visitor opt-in, a service worker, and an authenticated server/Edge Function to send notifications. No “send” button is shown that cannot actually deliver.

Back up Supabase data and media through a church-controlled process. The GitHub repository contains the website and database definition, not live CMS content or staff accounts.
