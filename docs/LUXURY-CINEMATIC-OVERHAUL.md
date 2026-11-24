# VEGANFARM Luxury Cinematic Overhaul

Status: browser and static CI verification passed on the implementation branch.

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

## Verification results

- JavaScript syntax checks passed for both presentation scripts and the browser audit.
- Rescue-photo static security checks passed; the existing Team Edge Function type-check passed.
- Chromium browser audit passed 161 route/viewport checks across seven widths (360, 390, 430, 768, 1024, 1440 and 1920 px).
- Zero browser/page errors, broken images, horizontal overflow errors or failed network responses were reported.
- English-only check passed: `lang=en`, `dir=ltr`, no language controls, no translation scripts and no non-English selector options.
- Mobile navigation passed; donation form and QR were present; Team access gate passed its visual contrast/focus checks; unauthenticated Founder access remained gated.
- Scroll-reveal checks passed and the audit generated 28 screenshots.

## Verification boundary

The browser audit tests the unauthenticated Team access screen and Founder sign-in gate. It does not sign in as a real Team member or Founder, submit a real donation, or make a payment. Authenticated workflows and live payment settlement still require a controlled staging test. No Supabase schema, records, RLS policies, Edge Functions, authentication settings or storage objects were modified by this presentation work.
