# Taylor's USA Adventure 2026 — App Spec

Living requirements doc for this app. Update this file whenever a new requirement
is agreed, instead of relying on the original one-off Lovable build prompt (which
is not tracked here and will not reflect future changes).

Private, personal-use trip dashboard for Taylor's USA trip, 6–24 August 2026:
work deployment in Miami, then a personal leg through Austin and Houston, back
through Miami. No public product framing — built to be actually checked on a
phone while travelling, with patchy connectivity.

---

## Tech & Hosting

- Static HTML/CSS/JS, no build step, no framework, no backend.
- Files: `index.html`, `css/style.css`, `js/data.js` (content), `js/app.js`
  (rendering/routing/storage), `sw.js` (offline app-shell cache), `manifest.webmanifest`.
- Hosted on Netlify, auto-deploying from branch `claude/app-build-markdown-kbijun`
  on every push. Build command: none. Publish directory: repo root.
- No password gate — access is via the unlisted deploy URL only.

## Design System

- Typography: Jost (Google Font) only, for headings and body text.
- Colours (Spectra system):
  - Primary: `#829b86`
  - Secondary: `#a09edd`
  - Accent: `#625ee3`
- Single-screen dashboard-style home, mobile-first, no separate landing page.
- Light/dark aware (respects `prefers-color-scheme`).

## Data & Access Rules (non-negotiable)

- Storage: browser `localStorage` only. Single device/browser, no sync, no account.
  Storage keys (`taylorUsa2026.packing`, `taylorUsa2026.bucket`) must stay stable
  across future edits — renaming/removing them wipes Taylor's saved progress.
- Redeploying the app (new HTML/CSS/JS) never touches `localStorage` — it's scoped
  to the browser + site origin, not to the deployed files.
- Never store passport numbers, ID numbers, or unmasked confirmation/card numbers.
  Where real data isn't available, show a visibly labelled "Details to follow"
  placeholder — never invented/dummy data that resembles a real value.
- No live external links to Google Docs or other source documents — all itinerary
  content is embedded directly in `js/data.js`.

## App Structure

### Home / Dashboard
- Trip name, dates, base city.
- Personal note card from Mum (see "Personal Touches" below) — sits directly
  under the title, before the trip-status banner and leg list.
- Status banner: live countdown / "on the trip" state computed from today's date.
- Leg cards for all four legs, current/next leg visually highlighted based on
  today's date vs. each leg's date range.
- Quick nav into Packing List, Useful Information, Texas Bucket List, Flights.

### Leg Pages (4)
1. **Miami — Work Deployment**, 6–17 Aug 2026 (Miami Shores Villa, Airbnb)
2. **Austin, Texas**, 19–22 Aug 2026 (Kasa Downtown Austin)
3. **Houston, Texas**, 22–23 Aug 2026 (Club Quarters Hotel Downtown)
4. **Miami — Return, Pre-Flight**, 23–24 Aug 2026 (Hampton Inn & Suites Blue Lagoon)

Each leg page includes (where applicable to that property): check-in/out times,
minimum age, room type, cost, cancellation policy, confirmation number (or
placeholder), address (or placeholder), "About this space" description,
amenities, nearby attractions/dining/shopping with drive times, house rules,
work schedule (Miami leg 1 only), event flag (Austin — PBR Gambler Days /
Moody Center), and a local contact card (Austin — Deleigh Hermes).

### Supporting Pages
- **Packing List** — interactive checklist grouped by category exactly as
  specified in the source itinerary; per-item checked state persisted in
  localStorage; progress counter ("X of Y packed").
- **Useful Information** — emergency, currency, time zones, power, transport,
  weather, tipping, useful apps.
- **Texas Bucket List** — checkable list, same persistence pattern as packing.
- **Flights** — empty-state page listing the fields to expect (airline, flight
  numbers, times, booking reference, etc.) until real flight data is confirmed.
  Never populate with invented flight numbers/times/references.

## Known Data Gaps (do not fill with invented data)

1. Miami villa: confirmation number, exact address — not available.
2. Houston and Miami-return stays: confirmation numbers masked in source —
   placeholder shown, note to keep the Expedia confirmation accessible separately.
3. Flight itinerary — not yet reviewed, structure only.
4. Miami leg 1 work schedule beyond 7–9 August — structure confirmed, exact
   dates pending confirmation against the overview document.

## Personal Touches

- **Home page note from Mum** — distinct card (secondary-colour tint, left
  accent border) directly under the trip title, before the status banner and
  leg list, so it reads as a personal message rather than itinerary data. Line
  breaks in the message are preserved exactly. Content lives in `js/data.js`
  as `MUM_NOTE`.
- **Site-wide footer** — small, low-contrast footer on every page:
  `Made with love from Mum 🫶🏻 | Version {APP_VERSION} • USA Adventure 2026`.
  Rendered once in `app.js` (`buildFooter()`) alongside every route, not
  duplicated per page. Bump `APP_VERSION` in `js/data.js` when it's worth
  surfacing a version bump to Taylor.

## Useful Information Links

- In the Useful Information page, items that name a specific app or service are
  tap-to-open links: Emergency Number (`tel:911`), and in Transport / Useful
  Apps — Uber, Google Maps, Apple Maps, Airbnb, Expedia, Weather App. These
  open the service's app via universal link where the OS supports it, falling
  back to the website.
- "Airline App" is deliberately left as plain text — the airline isn't known
  yet (flights unconfirmed), so it isn't linked rather than guessing one.

## Google Maps Directions

- Every "N min away" attraction/dining/shopping entry (Miami leg) links to
  Google Maps turn-by-turn directions (`maps/dir/?api=1&destination=...`),
  using the viewer's live device location as the origin — this is intentional:
  it means the links route correctly from wherever Taylor actually is at the
  time, and will look like a long/international route if opened from outside
  the US (e.g. while testing). Do not hardcode an origin.
- Property addresses with a confirmed exact address (Austin, Houston, Miami
  return) get a "Get directions" link under the address.
- Where only an area is known (Miami villa, address still outstanding), show
  a "View area on map" link to the named area instead of guessing an address.
- The Austin event flag (PBR Gambler Days / Moody Center) has its own
  directions link.
- Texas Bucket List items tied to a real, named place (Boot Barn, Sheplers,
  Downtown Austin, South Congress, Texas State Capitol, Moody Center) get a
  small map-pin icon opening directions, without toggling the item's checkbox.

## Build Priority (original, retained for reference)

1. Home dashboard + navigation structure
2. Four leg pages with full confirmed accommodation and local-area content
3. Placeholder sections built and visibly marked as pending (not hidden, not faked)
4. Local contact card for Austin (Deleigh)
5. Event flag for PBR Gambler Days during Austin dates

---

## Change Log

- **v1.0** — Initial build: home dashboard, four leg pages, packing list,
  useful information, Texas bucket list, flights empty state.
- Added Google Maps directions links (attractions/dining/shopping, property
  addresses, event flag, bucket-list landmarks).
- Added personal note from Mum on the home page, and a site-wide footer.
- Added SPEC.md as the living requirements doc.
- Made app/service names in Useful Information tap-to-open links (Emergency
  911, Uber, Google Maps, Apple Maps, Airbnb, Expedia, Weather App); left
  "Airline App" plain since the airline isn't confirmed yet.
