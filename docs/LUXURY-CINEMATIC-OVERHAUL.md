# VEGANFARM Luxury Cinematic Overhaul

Status: implementation branch; browser and CI verification pending.

## Approved design direction

- Luxury cinematic visual direction.
- Designer-selected forest-green, ivory and champagne-gold palette.
- Full-screen cinematic animal photography.
- Subtle reveal and hover transitions, with reduced-motion support.
- English only; document language remains `en` and left-to-right.
- Full public and private page visual treatment.

## Presentation files

- `assets/veganfarm-luxury-cinematic.css` — visual system, responsive layouts, navigation, page, dashboard, forms and footer styling.
- `assets/veganfarm-luxury-cinematic.js` — final homepage renderer, public city-level rescue explorer, public impact dashboard and reveal effects.
- `index.html` — loads the new stylesheet and script after the existing application presentation layer.

## Data and security boundaries

The new presentation layer reads only existing public case records and the existing public verified-total aggregate. It does not query Supabase directly, introduce new tables, alter RLS, change Edge Functions, change payment destinations or access private case records.

The rescue explorer uses approximate city-level positions only for locations already present in published public case records. It does not display precise addresses or private coordinates. Locations not mapped to the small set of recognised cities remain in the case list without a map marker.

The existing core router, donation submission handler, QR and UPI payment information, Founder authentication, Team access flow, signed private-photo handling and Supabase data model remain the source of truth.

## Verification required

- JavaScript syntax checks for both presentation scripts.
- Existing rescue-photo security regression checks.
- Browser audit across all existing routes and seven viewport widths.
- English-only, mobile navigation, donation form/QR, Team gate and unauthenticated Founder-gate checks.
- Confirm that all map and dashboard values derive from public records only.
- Do not merge or deploy if the browser audit reports route, overflow, image, network or access-control failures.
