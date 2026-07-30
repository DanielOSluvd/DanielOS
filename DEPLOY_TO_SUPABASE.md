# Connect Daniel OS to Supabase

## 1. Create the project
Create a free Supabase project. Wait until the database finishes provisioning.

## 2. Create the database table
Open **SQL Editor**, paste everything from `supabase-schema.sql`, and click **Run**.

## 3. Add browser credentials
Open **Project Settings → API** and copy:

- Project URL
- Publishable key (or legacy anon key)

Paste both into `config.js`. Never use a secret key or service-role key in the browser.

## 4. Configure authentication
In **Authentication → URL Configuration**:

- Set **Site URL** to your hosted Daniel OS URL.
- Add the same URL under **Redirect URLs**.

Email/password login is used. Supabase may require email confirmation depending on your Auth settings.

## 5. Host the website
Supabase supplies the database and authentication, but this static website still needs a web host. Free options include Cloudflare Pages, Netlify, or GitHub Pages. Upload the contents of this folder, not the enclosing ZIP.

## Migration behaviour
- The first successful login uploads existing browser data when no cloud record exists.
- When cloud data already exists, it becomes the source of truth and reloads the app.
- Subsequent edits are saved locally immediately and synced to Supabase after a short debounce.
- Export Backup remains available as an additional safety copy.
