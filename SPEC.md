# Taylor's USA Adventure 2026 — App Spec

Living requirements doc for this app. Update this file whenever a new requirement
is agreed, instead of relying on the original one-off Lovable build prompt (which
is not tracked here and will not reflect future changes).

Private, personal-use trip dashboard for Taylor's USA trip, 6–24 August 2026: a
stay in Miami, then a personal leg through Austin and Houston, back through
Miami. No public product framing — built to be actually checked on a phone
while travelling, with patchy connectivity. Reads end-to-end as a standard
personal travel companion app — see "Neutral Language" below for a hard rule
about what must never appear in it.

---

## Neutral Language (mandatory, check every change against this)

This app must never indicate that Taylor is travelling for military/defence
business. Concretely:

- No "Air Force," "military," "deployment," "defence/defense," or "shift" (in
  a work-roster sense) anywhere — not in rendered text, not in `js/data.js`
  content, not in code comments, not in this file.
- Leg 1 is "Miami Stay," not "Miami (Work Deployment)." Its daily-commitments
  section is "Daily Schedule," and individual entries are "Commitment," not
  "Shift."
- There is no packing category naming or implying a uniformed job. If a
  future edit needs to reintroduce work-related packing items, keep the
  category and item names generic (e.g. "Work Gear" / "Required items"), not
  ones that reveal a specific occupation.
- Before shipping any change that touches leg 1 or its schedule, grep the
  whole repo (not just `js/data.js`) for `(?i)air force|military|deployment|
  defence|defense|shift` and confirm zero matches outside historical
  discussion in this Change Log.

## Tech & Hosting

- Static HTML/CSS/JS, no build step, no framework, no backend/database.
- Files: `index.html`, `css/style.css`, `js/data.js` (content), `js/app.js`
  (rendering/routing/storage), `sw.js` (offline app-shell cache),
  `manifest.webmanifest`, `docs/*.pdf` (bundled booking confirmations).
- Hosted on Netlify, auto-deploying from branch `claude/app-build-markdown-kbijun`
  on every push. Build command: none. Publish directory: repo root.
- **Canonical URL: `https://taylor-usa.digitalcreative.app`** — a custom
  domain in front of the same Netlify site, gated by Cloudflare Access to
  an explicit list of family email addresses — a single Allow policy with
  one "Emails" Include rule, added to as more family want to follow along.
  The dashboard policy is the source of truth for who's on it; don't
  restate the list here, it only goes stale. This is the link to share/use.
  The original `taylor-usa.netlify.app` still exists (Netlify always keeps
  the auto-generated subdomain alongside any custom domain) but is **not**
  behind Cloudflare Access, so `_redirects` at the repo root force-redirects
  it (301) to the custom domain — otherwise it'd be a standing way to
  bypass the login gate entirely. If the custom domain or its Cloudflare
  Access setup ever changes, update `_redirects` to match.
- Access login methods: **Google** (so the Gmail users get a one-tap sign-in)
  and **Cloudflare** (kept deliberately as a fallback — if the Google OAuth
  client ever breaks, it's the way back into the account). Google is wired
  up via a "Web application" OAuth client in the Google Cloud Console, whose
  authorised redirect URI **must** be
  `https://<team-name>.cloudflareaccess.com/cdn-cgi/access/callback`.
  That `<team-name>` is the Zero Trust team name (Zero Trust > Settings >
  General), so **renaming the team silently breaks Google login** with
  `redirect_uri_mismatch`. To rename safely: add the new URI in the Google
  console *first* (a client can hold several), then rename, then test, then
  delete the old URI. Note the Google console warns changes can take minutes
  to hours to propagate — a mismatch error straight after a rename is
  usually lag, not misconfiguration.
- Testing the login gate: use the canonical URL in a private window. Signing
  in from inside the Cloudflare dashboard — the identity provider's **Test**
  button, or the `<team-name>.cloudflareaccess.com` App Launcher — only ever
  proves the IdP works and returns you to the dashboard; it never reaches
  the app. A private window also sidesteps `sw.js` serving a cached copy.
- The only outbound network calls the app ever makes are to Open-Meteo (live
  weather, keyless/CORS-friendly) and Google Maps (opening directions in a
  new tab). Both fail quietly to a static fallback if unreachable — the app
  is fully usable offline otherwise.

## Design System

- Typography: Jost (Google Font) only, for headings and body text.
- Colours (Spectra system):
  - Primary: `#829b86`
  - Secondary: `#a09edd`
  - Accent: `#625ee3`
- Mobile-first, native-app feel: fixed bottom tab bar for primary navigation
  (Home, Packing, Bucket List, Gallery, More), not a website-style top nav.
  Touch targets sized to the ~44px minimum guideline throughout (checklist
  rows, calculator buttons, tab bar items).
- Light/dark aware (respects `prefers-color-scheme`). Tinted card/badge
  backgrounds (flag boxes, placeholder badges, directions pills, etc.) are
  built with `color-mix(..., var(--tint))`, where `--tint` is white in light
  mode and a dark neutral in dark mode — never hardcode `white` as the mix
  target, or text becomes unreadable in dark mode (this happened once
  already).

## Data & Access Rules (non-negotiable)

- Storage: browser `localStorage` (small state) + `IndexedDB` (photos,
  documents) only. Single device/browser, no sync, no account, no server.
- Storage keys/DB names (`taylorUsa2026.*`, `taylorUsa2026Gallery`,
  `taylorUsa2026Docs`) must stay stable across future edits — renaming or
  removing them wipes Taylor's saved progress/photos/documents. This
  intentionally did **not** change during the v1.1 data-model refactor (see
  below) even though the content structure did.
- Redeploying the app (new HTML/CSS/JS) never touches stored data — it's
  scoped to the browser + site origin, not to the deployed files.
- Never store passport numbers, military ID, boarding passes, or other
  sensitive documents/numbers anywhere in the app. Where real data isn't
  available, show a visibly labelled "Details to follow" placeholder — never
  invented/dummy data that resembles a real value.
- No live external links to Google Docs or other source documents — all
  itinerary content is embedded directly in `js/data.js`.

## Data Model (generic/multi-trip-ready)

As of v1.1, `js/data.js` nests everything for one trip under `TRIPS[<id>]`
instead of flat globals, so a future second trip is "add another entry to
`TRIPS`," not a rendering-code rewrite:

```js
const CURRENT_TRIP_ID = "usa-2026";
const TRIPS = {
  "usa-2026": {
    meta: { id, name, start, end, base, homeTimeZone: { zone, label } },
    cities: { "<leg.location>": { label, zone, lat, lon, salesTaxPct, fallbackWeather } },
    legs: [ ... ],
    packingList: [ ... ],
    usefulInfo: [ ... ],
    bucketList: [ ... ],
    flights: { ... },
    flightFieldDefs: [ ... ],
  },
};
```

`js/app.js` never references `TRIPS` directly — it reads the compatibility
consts at the bottom of `data.js` (`TRIP`, `CITIES`, `LEGS`, `PACKING_LIST`,
`USEFUL_INFO`, `BUCKET_LIST`, `FLIGHTS`, `FLIGHT_FIELD_DEFS`), which are just
`TRIPS[CURRENT_TRIP_ID].<field>` unpacked. This keeps the rendering code
unchanged while the content became trip-scoped. **Storage key strings in
`js/app.js` (`STORAGE_KEYS`) were deliberately left as their original
literal values**, not derived from the trip id — deriving them would have
been "more correct" architecturally but would orphan anything already saved
in a returning visitor's browser. If a second trip is ever added, decide
then whether storage needs per-trip namespacing (it will, if both trips
should keep independent packing/bucket state).

`CITIES` (keyed by the same string each leg uses as `location`) is the
single source of truth for a place's time zone, coordinates, default sales
tax rate, and fallback weather text — used by the dashboard widgets so
Miami's two legs don't duplicate this data.

## App Structure

### Home / Dashboard

Quick-glance priority order, top to bottom, paired half-width where content
allows (mobile UX goal: everything below reachable with minimal scrolling):

1. **Trip status + Weather** (half/half). Status is the existing live
   countdown banner (`formatCountdown()`), just restyled to sit in a grid
   cell (`.status-banner--tile`). Weather: live current temperature in
   **both** °F and °C (one Open-Meteo call fetches Celsius, Fahrenheit is
   derived from it, not a second API call), **humidity** (💧%), and a
   WMO-weather-code emoji icon (`WMO_WEATHER_ICONS`) for the current city —
   the city name lives in the tile's label ("Weather · Miami") to save a
   line. Falls back silently to the static seasonal description
   (`CITIES[...].fallbackWeather`, no icon/humidity) if offline or the
   request fails/times out (6s `AbortController` timeout).
2. **Current City + Today's Schedule** (half/half). Current City: the
   current leg's city if today falls within one, otherwise the next
   upcoming leg's city. Today's Schedule: a day/date subheading (NZ format,
   e.g. "Thursday, 6 August") over a plain-language one-liner — a
   dailySchedule commitment today, an event happening today, check-in/
   check-out day, a free day, or (pre-trip/post-trip) the countdown text.
   These two tiles are allowed to end up different heights (grid stretch
   just leaves empty space in the shorter one) since Today's Schedule text
   length varies day to day — not a bug.
3. **Live Time Zones** (full width — see note below on why this and the
   calculator aren't paired). New Zealand, Miami (ET), Texas (CT), ticking
   every 30s. Uses `Intl`/`toLocaleTimeString` with real IANA zone names
   (`Pacific/Auckland`, `America/New_York`, `America/Chicago`) — **never**
   hardcode a UTC offset, since that breaks across daylight saving
   transitions. A small `+1d`/`-1d` badge shows when a zone's calendar date
   differs from home.
4. **Tip & Sales Tax Calculator** (full width — deliberately not paired
   with Time Zones: the four tip quick-buttons need ~44px+ each to stay
   comfortably tappable, and a half-width column doesn't have room for
   that without shrinking them below the touch-target goal). One card, two
   independent calculators. Tip: bill amount + 15/18/20/25% quick buttons →
   tip amount + total. Sales tax: purchase amount + an editable % field
   (defaults to the current city's `salesTaxPct` from `CITIES`, e.g. 7%
   Miami vs 8.25% Texas) → tax amount + total. Pure client-side, no
   persistence (deliberately — it's a quick lookup tool, not trip data), no
   calls to `render()` on input so it never disrupts the live clock or
   triggers a full re-render.
5. **Next Accommodation + Next Travel Event** (half/half, unchanged from
   before). Next Accommodation: current/next leg's property name +
   check-in. Next Travel Event: the next leg transition ("Move to {city},"
   next start date), or a flight-home fallback once on the last leg.

Then: a compact "Trip Legs" grid (all four legs, current/next highlighted)
as a full-itinerary overview. There is no separate "Trip Info" quick-link
grid anymore — Packing/Bucket List/Gallery live in the bottom tab bar, and
Useful Information/Flights live in the "More" drawer, so a duplicate set of
links on Home would just add scroll length without adding reach.

There is no personal note on the dashboard (see Change Log — removed in
v1.1 at the user's request, since Taylor had already read it).

### Navigation

- **Bottom tab bar** (fixed, thumb-reachable): Home, Packing, Bucket List,
  Gallery, More. "More" opens the same slide-in drawer as before, now
  scoped to Trip Legs (leg 1–4) and the remaining Trip Info pages (Useful
  Information, Flights) — everything reachable in the tab bar isn't
  duplicated in the drawer.
- Top header is now title-only (no buttons) — it's a status bar, not a nav
  surface, since navigation lives in the bottom tab bar.

### Leg Pages (4)
1. **Miami Stay**, 6–17 Aug 2026 (Miami Shores Villa, Airbnb)
2. **Austin, Texas**, 19–22 Aug 2026 (Kasa Downtown Austin)
3. **Houston, Texas**, 22–23 Aug 2026 (Club Quarters Hotel Downtown) — Astros
   vs Athletics, Sat 22 Aug 6:10 PM CT, Daikin Park (confirmed by Taylor)
4. **Miami — Return, Pre-Flight**, 23–24 Aug 2026 (Hampton Inn & Suites Blue Lagoon)

Each leg page includes (where applicable to that property): check-in/out times,
minimum age, room type, cost, cancellation policy, confirmation number (or
placeholder), address (or placeholder), a "Booking Document" PDF slot, "About
this space" description, amenities, nearby attractions/dining/shopping with
drive times, house rules, a "Daily Schedule" (leg 1 only — see Neutral
Language above for exactly what this must and must not say), an event flag
(Austin — PBR Gambler Days / Moody Center; Houston — Astros vs Athletics /
Daikin Park), and a local contact card (Austin — Deleigh Hermes).

### Supporting Pages
- **Packing List** — interactive checklist grouped by category; per-item
  checked state persisted in localStorage; progress counter ("X of Y
  packed"). Every category card (including "Shopping") has its own "Add an
  item…" field at the bottom, so Taylor's own additions land in the right
  section rather than a separate pile — stored with a category tag
  (`taylorUsa2026.packingCustom`), with a delete (×) button, counted into
  the same progress total. A catch-all "Other" card only appears if an
  item's category doesn't match any current category (safety net, not
  expected in normal use).
- **Useful Information** — emergency, currency, time zones, power, transport,
  weather, tipping, useful apps, plus a general editable note field. Items
  naming a specific app/service are tap-to-open links: Emergency Number
  (`tel:911`), Uber, Google Maps, Apple Maps, Airbnb, Expedia, Weather App.
  "Airline App" stays plain text — the airline wasn't linked to avoid
  guessing which app before it was confirmed.
- **Trip Bucket List** — grouped by location (Austin, Houston, Key West),
  same checkbox + per-section "Add something…" pattern as the Packing List.
  Austin carries the original confirmed content; Houston has the confirmed
  Astros game; Key West starts empty rather than inventing things to do
  there. Custom items stored in `taylorUsa2026.bucketCustom` with a
  `location` tag. Items tied to a real, named place get a map-pin icon
  (Google Maps directions) without toggling the checkbox.
- **Flights** — confirmed values (currently: Airline "United", Booking
  Reference "LDY8D7") show as plain rows; every still-unconfirmed field
  (flight numbers, departure/arrival airport, departure/arrival times,
  boarding passes, seat numbers) gets its own placeholder + "+ Add a note"
  so Taylor can fill each one in individually as he gets it. A "Flight
  Documents" PDF slot and a general "Anything else" note field round it out.
  Never populate a structured field with an invented value — only real
  confirmed data goes in `FLIGHTS` (`js/data.js`).
- **Gallery** — on-device photo gallery. "+ Add Photos" opens the standard
  mobile file picker (camera or library — works the same on iPhone 16's
  Safari/Chrome, since iOS mandates WebKit under the hood for all browsers).
  Photos are resized/re-encoded client-side (max 1600px, JPEG ~0.82 quality)
  before being stored as Blobs in IndexedDB (`taylorUsa2026Gallery`) —
  localStorage's ~5-10MB limit can't hold photos, IndexedDB can. Tap a
  thumbnail for a full-screen lightbox with delete.
- **Budget** — manual expense tracking, categorized (`BUDGET_CATEGORIES` in
  `js/data.js`: Accommodation, Food & Drinks, Activities, Shopping,
  Transport, Other). A summary card shows total spent + per-category
  totals; an add-expense form takes amount, category, optional description,
  date (defaults to today), and an **optional** receipt photo; the expense
  list shows every entry with a delete (×) and, if a photo was attached, a
  🧾 button opening it in the same lightbox the Gallery uses. Expense
  records (amount/category/description/date) live in localStorage
  (`taylorUsa2026.budget`); receipt photos are compressed the same way as
  Gallery photos and stored separately in IndexedDB
  (`taylorUsa2026Receipts`, one per expense id) since they don't fit in
  localStorage. **Deliberately no OCR/auto-scan-the-amount** — discussed
  and explicitly deferred: on-device OCR (e.g. Tesseract.js) would add
  several MB and still misread which line on a receipt is the total,
  requiring Taylor to double-check anyway; a receipt-specialized cloud API
  would need a backend to keep its key secret, which breaks the no-server
  design this whole app has kept to. Revisit only if manual entry proves
  genuinely annoying in practice.

## Known Data Gaps (do not fill with invented data)

1. Miami villa: confirmation number, exact address — not available.
2. Houston and Miami-return stays: confirmation numbers masked in source —
   placeholder shown, note to keep the Expedia confirmation accessible
   separately. Real Expedia PDFs are bundled (see Booking Documents).
3. Flight itinerary — Airline and Booking Reference confirmed; flight
   numbers, airports, times, boarding passes, seat numbers still pending.
4. Miami leg 1 daily schedule beyond 7–9 August — structure confirmed,
   exact dates pending confirmation.

## Booking Documents (PDF)

- Each leg's accommodation card has a "Booking Document" slot, and Flights
  has a "Flight Documents" slot — same upload/view/replace/remove control
  (`renderDocSlot` in `js/app.js`), backed by IndexedDB (`taylorUsa2026Docs`)
  since PDFs don't fit in localStorage. One document per slot; uploading
  again replaces the previous one.
- Austin, Houston, and the Miami-return leg ship with their real Expedia
  booking-confirmation PDFs bundled as static files in `docs/` (linked via
  `property.confirmationPdf` in `js/data.js`) and precached by the service
  worker, so they're available offline from the first load. The Miami villa
  (leg 1, Airbnb) and Flights have no bundled default, only the upload
  option, since no PDF exists for those yet.
- Uploading your own PDF to a slot that has a bundled default replaces it
  in the UI; removing your upload reverts to showing the bundled default
  again (it's never deleted, just superseded).

## Editable Notes

- Wherever a real detail is missing and shown as a "Details to follow"
  placeholder (Miami villa address & confirmation, Austin/Houston/Miami-return
  confirmation numbers, each unconfirmed Flights field) and on Useful
  Information (a general note), Taylor can tap "+ Add a note" to type his
  own free-text note — editable/clearable afterwards via "Edit note".
  Persisted in localStorage (`taylorUsa2026.notes`), keyed per field so it's
  independent of the reference data in `js/data.js`.

## Google Maps Directions

- Every "N min away" attraction/dining/shopping entry (Miami leg) links to
  Google Maps turn-by-turn directions (`maps/dir/?api=1&destination=...`),
  using the viewer's live device location as the origin — this is intentional:
  it means the links route correctly from wherever Taylor actually is at the
  time, and will look like a long/international route if opened from outside
  the US (e.g. while testing). Do not hardcode an origin.
- Property addresses with a confirmed exact address get a "Get directions"
  link under the address. Where only an area is known (Miami villa), show a
  "View area on map" link to the named area instead of guessing an address.
- Event flags each have their own directions link, driven by an
  `eventFlag.venue` field — not hardcoded per leg.
- Bucket List items tied to a real, named place get the same map-pin
  treatment.

## Build Priority (original, retained for reference)

1. Home dashboard + navigation structure
2. Four leg pages with full confirmed accommodation and local-area content
3. Placeholder sections built and visibly marked as pending (not hidden, not faked)
4. Local contact card for Austin (Deleigh)
5. Event flag for PBR Gambler Days during Austin dates

---

## Next Trip: Philippines, April 2027 (not started)

The USA 2026 build was explicitly treated as a beta test for this. Nothing
here is built yet — this section exists so the reasoning isn't re-derived
from scratch in eight months.

### What carries over for free

- The whole rendering/routing layer in `js/app.js`. It reads
  `TRIPS[CURRENT_TRIP_ID]` via the compatibility consts and never touches
  trip content directly, so a second trip is a new entry in `TRIPS` plus a
  changed `CURRENT_TRIP_ID` — see "Data Model" above.
- The design system, the offline app-shell service worker, the Netlify +
  custom-domain hosting pattern, and the Cloudflare Access/Google login
  setup (documented in "Tech & Hosting" — reuse the same Zero Trust org,
  just add an Access application for the new hostname).

### Decisions to make before anything is built

1. **Shared state, or device-local like now?** This is the only decision
   that cannot be bolted on later, so settle it first. Everything today is
   `localStorage`/`IndexedDB` on one device with no server, no sync and no
   accounts — ideal for a single traveller's phone. If several people are
   travelling together and want a *shared* packing list, a shared gallery,
   or a budget that totals across people, that is a different application
   with a backend, and it invalidates the "Data & Access Rules" section
   above rather than extending it. Decide who the app is for before
   designing anything.
2. **Per-trip storage namespacing.** "Data Model" above deliberately
   deferred this: `STORAGE_KEYS` in `js/app.js` are hardcoded
   `taylorUsa2026*` literals rather than derived from the trip id, to avoid
   orphaning a returning visitor's saved data. A second trip forces the
   issue — the Philippines packing list, gallery and budget must be
   independent of the USA ones. Namespace the keys by trip id, and migrate
   (don't drop) the existing USA data.

### Content/feature changes this trip specifically needs

- **The tip/tax calculator does not transfer.** It is built around US sales
  tax added at the till and US tipping norms. Philippine pricing is
  generally VAT-inclusive and tipping conventions differ, so this needs
  redesigning or removing, not re-pointing at a new tax rate.
- **Currency conversion (NZD⇄PHP) is a real feature here**, and its absence
  was arguably a gap on the USA trip too. Note the "no backend" and offline
  constraints: a hardcoded rate set at build time, clearly labelled as
  approximate, may beat a live API that fails when there's no signal.
- **`CITIES` needs rebuilding** — zone, lat/lon and fallback weather per
  Philippine location. `salesTaxPct` is USA-specific and should follow the
  calculator's fate.
- **Offline matters more.** Island-hopping, ferries and roaming gaps make
  patchy connectivity the norm rather than the exception. Weight decisions
  toward bundled-and-cached over fetched.
- **Confirm whether the "Neutral Language" rule applies to this trip**
  before any content is written. It was a hard requirement for USA 2026;
  do not assume either way for 2027, and ask rather than guess.

### Lessons from the beta

- **The app has two audiences, and only one was designed for.** It was
  built for the traveller, but ended up shared with family following along
  — who log in and see an empty gallery, an unticked packing list and a
  zeroed budget, because all of that is stored on the traveller's own
  device. It looks broken when it is working exactly as designed. Either
  give viewers an honest empty state that explains this, or decide (per
  decision 1) that following along is a real use case and build for it.
- **Testing the login gate needs the real URL in a private window** — see
  "Tech & Hosting". Time was lost to a login that appeared to work but only
  ever returned to the Cloudflare dashboard.
- **Capture friction while the trip is live.** What the traveller couldn't
  find, wanted and didn't have, or found annoying, is only observable in
  the field and is unrecoverable afterwards.

## Change Log

- **v1.0** — Initial build: home dashboard, four leg pages, packing list,
  useful information, bucket list, flights empty state.
- Added Google Maps directions links (attractions/dining/shopping, property
  addresses, event flag, bucket-list landmarks).
- Added a personal note from Mum on the home page, and a site-wide footer.
- Added SPEC.md as the living requirements doc.
- Made app/service names in Useful Information tap-to-open links.
- Added a packing "add your own item" capability, and editable notes on
  every "details to follow" placeholder plus the Flights page.
- Fixed the service worker: it was cache-first, so updates only appeared on
  a *second* reload after a deploy. Switched to network-first.
- Fixed dark mode: several tinted backgrounds were hardcoded to mix toward
  white, making text on them unreadable in dark mode. Introduced a `--tint`
  variable.
- Moved packing "add your own item" from one section at the end to a small
  form at the bottom of every category card.
- Added Houston event flag (Astros vs Athletics, Daikin Park); generalized
  the event-flag directions link to use an `eventFlag.venue` field.
- Restructured the Texas-only bucket list into the location-grouped Trip
  Bucket List (Austin/Houston/Key West) with per-section add-item.
- Added a Gallery page: on-device photo storage via IndexedDB. Fixed a bug
  where the full-screen lightbox stayed open across page navigation.
- Added Taylor's confirmed flight details (Airline: United, Booking
  Reference: LDY8D7) and rebuilt Flights with per-field placeholders + notes.
- Added PDF booking-document upload to every leg's accommodation card and
  to Flights; bundled Taylor's real Expedia confirmation PDFs for Austin,
  Houston, and the Miami-return leg as static defaults.
- **v1.1** — Major update, five parts:
  1. **Removed all military/defence references** (mandatory, done first):
     Leg 1 renamed "Miami (Work Deployment)" → "Miami Stay"; "Work Schedule"
     → "Daily Schedule"; "Shift" → "Commitment"; deleted the "Air Force"
     packing category and its items (Uniforms, Boots, Required work gear,
     ID/Military identification) entirely. Audited the whole repo (not just
     `js/data.js`) for these terms — see "Neutral Language" above for the
     standing rule this leaves in place.
  2. **Dashboard rebuilt** to the quick-glance priority order documented
     above: Current City, Today's Schedule, live DST-aware Time Zones, Tip
     & Sales Tax Calculator, Weather (live, Open-Meteo), Next Accommodation,
     Next Travel Event.
  3. **Mobile UX**: replaced the top hamburger menu with a fixed bottom tab
     bar (Home/Packing/Bucket List/Gallery/More) for thumb-reachable nav;
     the drawer ("More") now only holds Trip Legs and the remaining Trip
     Info pages, since the rest live in the tab bar; bumped touch target
     sizes (checklist rows, calculator buttons) toward the ~44px guideline.
  4. **Removed the "From Mum" note** from the dashboard — Taylor had
     already read it, so it's fully deleted (data, rendering, and CSS), not
     just hidden. Recoverable from git history if ever wanted back. The
     small site-wide footer signature was left as-is since it wasn't what
     was asked to be removed.
  5. **Refactored `js/data.js` into a generic, multi-trip-ready structure**
     (`TRIPS[<id>]`, see "Data Model" above) — this version still only
     shows Taylor's USA trip, but adding a second trip later no longer
     means restructuring `js/app.js`. Storage key strings were
     deliberately left unchanged to avoid orphaning Taylor's already-saved
     packing/bucket/notes/photos/documents.
- Added humidity and a weather-code emoji icon to the dashboard Weather
  tile, alongside the existing dual °F/°C reading.
- Added `_redirects`: the old `taylor-usa.netlify.app` link now force-
  redirects to the Cloudflare Access-protected `taylor-usa.digitalcreative.app`,
  which is now the canonical URL (see "Tech & Hosting").
- Tightened the dashboard: paired Trip Status + Weather, and Current City +
  Today's Schedule, into half-width rows; added a day/date (NZ format)
  subheading to Today's Schedule. Time Zones and the Tip/Tax Calculator
  stay full-width — halving the calculator's row would shrink its
  tip-percentage buttons below a comfortable tap target.
- Added a Budget page (new bottom tab): categorized manual expense
  tracking with an optional receipt photo per entry, no OCR (see "App
  Structure" above for why auto-scan was explicitly deferred rather than
  built). Receipt photos stored in their own IndexedDB (`taylorUsa2026Receipts`),
  separate from Gallery, keyed one-per-expense.
- Fixed the Budget tab icon — the original was a hand-drawn SVG path never
  actually checked visually, and rendered malformed. Replaced with a
  verified dollar-sign icon.
- Added a render-time safety net: if a page's render function throws for
  any reason, `render()` now shows a visible "Something went wrong" card
  with a way back to Home, instead of silently leaving whatever was on
  screen unchanged (which looks exactly like "tapping the tab did
  nothing" — the actual symptom that surfaced this class of bug).
- Hardened the service worker's install step: `cache.addAll()` is
  all-or-nothing, so one blocked/failed precache (plausible on a
  Cloudflare Access-gated domain, where a background fetch might not
  carry the same auth context as a normal navigation) could silently fail
  the *entire* offline cache setup. Now precaches each file independently
  so one failure doesn't take the rest down with it.
- Documented the Cloudflare Access auth setup properly: added Google as a
  login method alongside Cloudflare (family members sign in with Gmail in
  one tap rather than the old two-step "Cloudflare, then Google" detour),
  and wrote down the team-name/redirect-URI coupling plus the safe rename
  procedure. Also corrected the allow-list description, which still claimed
  only two people had access; it now points at the dashboard policy as the
  source of truth rather than restating a list that keeps changing.
- Added a "Next Trip: Philippines, April 2027" section. The USA build was
  treated as a beta test for it, so this captures what carries over, the two
  decisions that must be made before building (shared vs device-local state,
  and per-trip storage namespacing — the latter explicitly deferred by the
  v1.1 data-model work), the USA-specific features that won't transfer, and
  the lessons the beta actually surfaced. Written now rather than in eight
  months, while the reasoning is still fresh.
