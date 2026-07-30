# Daniel OS Hybrid Starter

## What this version includes
- Home dashboard
- A separate saved page for every date
- Daily, weekly and monthly goals with shared date-aware progress
- Timeline, work notes, family notes and reflections
- Local browser persistence
- `.ics` import from Apple Calendar
- `.ics` export from Daniel OS timeline blocks
- A stored `webcal://` subscription link
- Weekly reviews
- JSON backup and restore
- Installable web-app manifest
- Colour-rich animated interface with photo-backed dashboard and life-system cards

## Open it now
Double-click `index.html`. Most features work locally.

Some browsers restrict app installation when opening a local file. Hosting it gives you the best experience.

## Put it online
The simplest route is Netlify Drop:

1. Unzip the folder.
2. Go to Netlify Drop.
3. Drag the entire `daniel_os_hybrid` folder onto the page.
4. Netlify provides a private-looking public URL.
5. Open that URL on iPhone.
6. In Safari, tap Share > Add to Home Screen.

GitHub Pages and Cloudflare Pages also work.

## Apple Calendar: safe starter method

### Import Apple Calendar events
1. Export a calendar as an `.ics` file from Calendar on Mac.
2. Open Daniel OS > Apple Calendar.
3. Choose the `.ics` file.

### Send Daniel OS blocks to Apple Calendar
When you add a timeline block, Daniel OS downloads an `.ics` event.
Open that file on an Apple device and add it to the desired Apple Calendar.

### Subscription URL
You may store a public `webcal://` Apple Calendar URL in Daniel OS.
Public calendar URLs are view-only and anyone with the link may be able to view the calendar.

## True two-way sync
This requires a hosted backend that:
- stores secrets only on the server
- authenticates to iCloud using CalDAV
- uses an Apple app-specific password
- encrypts credentials
- synchronizes changes on a schedule

Do not place an Apple password or app-specific password in `app.js`, HTML, browser storage or a public repository.

## Current storage limitation
This starter saves data to localStorage. Data stays in the current browser and device unless you export/import a backup. A production version should use a database and user sign-in.

## Multiple Apple calendars
The Apple Calendar page now has dedicated slots for Work Schedule, Work, Family, Personal, Leisure, Gym, Self Care and OTHER. Each calendar can have its own published `webcal://` or `https://` link, visibility toggle and colour. You can also select a category before importing one or more `.ics` files; imported events keep that category across the dashboard.

Work Schedule is intended for shifts, vacation, and scheduled work hours, while Work can hold meetings, coachings, follow-ups, and operational deadlines. A saved subscription link opens in Apple Calendar, but a static browser-only site cannot continuously download private Apple Calendar data. Automatic polling and true two-way synchronization still require the planned secure backend/CalDAV upgrade.


## Goal system added in v5
- Central Goals page with system and status filters
- Sort by target date, progress, system or creation date
- Six clickable Life System pages
- Large goals with target dates and status
- Mini goals / stepping stones
- Goal-specific timelines
- System-level visions and timelines
- Progress calculated from completed stepping stones

## Visual Calendar page
Version 6 adds a dedicated Calendar View with daily, weekly, and monthly layouts. It supports date navigation, calendar-category filters, optional weekend hiding, and comfortable or compact density. It displays imported events from the existing eight Apple Calendar categories.

## Supabase cloud edition
This build includes optional Supabase email/password authentication and automatic cloud sync. Follow `DEPLOY_TO_SUPABASE.md`, run `supabase-schema.sql`, and enter the project URL plus publishable/anon key in `config.js`.


## Apple Calendar live refresh

Version 8 adds an authenticated Supabase Edge Function that fetches published Apple Calendar feeds. See `APPLE_CALENDAR_SYNC_SETUP.md`.
