# Apple Calendar live sync setup

This upgrade uses an authenticated Supabase Edge Function. It fetches your published Apple Calendar feeds server-side, parses the `.ics` data, replaces prior synced copies without duplicating them, and saves the refreshed Daniel OS state.

## 1. Upload the updated website files

Replace the files in the root of your GitHub repository with the updated files from this package. Keep `index.html` at the repository root.

## 2. Deploy the Edge Function — dashboard method

1. In Supabase, open **Edge Functions**.
2. Select **Deploy a new function** and use the function name exactly:
   `sync-apple-calendars`
3. Open `supabase/functions/sync-apple-calendars/index.ts` from this package.
4. Paste the complete file into the Supabase function editor.
5. Deploy it.
6. Leave JWT verification enabled. Daniel OS invokes the function with the signed-in user's access token.

The standard `SUPABASE_URL` and `SUPABASE_ANON_KEY` variables are provided to hosted Supabase Edge Functions automatically.

## 3. Publish each Apple calendar

On a Mac, open Calendar and publish/share each calendar as a public calendar, then copy its subscription link. A published link is a read-only secret URL: anyone who possesses it can view that calendar, so do not post it publicly.

Paste each `webcal://` or `https://` URL into the matching Daniel OS calendar category and click **Save all calendars**.

## 4. Refresh

Sign into Daniel OS, open **Apple Calendar**, and click **Refresh Apple calendars**. Successful events will appear in the imported-event list and in Day, Week, and Month calendar views.

## 5. Optional automatic refresh

The included version refreshes on demand. Supabase Cron can invoke Edge Functions on a schedule, but a user-authenticated function cannot be safely scheduled with your browser session token. A future background-sync version should use a separate server-only secret and a narrowly scoped database function. Do not place a secret or service-role key in GitHub or `config.js`.

## Troubleshooting

- **No valid published links:** save at least one `webcal://` or `https://` published calendar URL.
- **HTTP 401:** sign out and back in, and confirm JWT verification is enabled for the function.
- **HTTP 404:** confirm the Edge Function is named exactly `sync-apple-calendars`.
- **Feed did not return iCalendar:** republish the Apple calendar and copy the subscription link again.
- **Private calendar:** Daniel OS cannot read a calendar that has not been published as a feed.
- **Recurring events:** this starter imports VEVENT records present in Apple's feed. Complex recurrence expansion may depend on what Apple includes in the published feed.
