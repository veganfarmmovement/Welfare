# VEGANFARM presentation architecture map

Status: development branch only. This document describes source-level ownership after the presentation refactor. It is not a browser-test report.

## Runtime ownership

| Layer | File | Responsibility | Must not own |
|---|---|---|---|
| Core application | `index.html` inline application code | Supabase client, data state, authentication, Founder and Team workflows, donation handlers, core route registry `P`, base `go()`, existing page renderers and the single navigation markup renderer | Secondary navigation or a second homepage shell |
| Presentation owner | `assets/veganfarm-forest-luxury.js` | Sole active presentation override for `P.home`, `P.projects`, `P.education`; dedicated route mastheads and page shells; footer; active-navigation state; one wrapper around core `go()`; route reveal effects | Supabase access, payment destinations, records, authentication or permissions |
| Interaction enhancement | `assets/modern-upgrade.js` | Scroll progress, sticky-nav state, reveal, button ripple, pointer tilt/magnetic effects and hero parallax; idempotent event setup | Homepage content injection, navigation, footer or route rendering |
| Retired compatibility asset | `assets/veganfarm-editorial-redesign.js` | No-op compatibility file retained because the HTML still references its URL | DOM writes, `P.home`, navigation, footer, `go()` or event handlers |
| Impact enhancement | `impact-enhancements.js` | Existing impact-specific enhancement; inspect separately before changing | Core route or security ownership |
| Private-photo feature | `assets/veganfarm-private-case-photos.js` | Signed-photo lifecycle and Founder photo-removal helper | Public permanent photo URLs or role policy changes |
| Locale layer | `assets/veganfarm-languages.js` | Language selector, exact-string dictionary, saved locale and document direction | Translation of user-submitted case data, names, financial references or URLs |

## Script loading order

The external script tags in `index.html` load in this order:

1. `assets/modern-upgrade.js`
2. Supabase browser SDK
3. `impact-enhancements.js` (deferred)
4. `assets/veganfarm-editorial-redesign.js` (now a no-op)
5. `assets/veganfarm-forest-luxury.js` (presentation owner)
6. `assets/veganfarm-piano.js`
7. `assets/veganfarm-private-case-photos.js`
8. `assets/veganfarm-languages.js`

Core application code and inline modules in `index.html` define the data and route functions used by the presentation owner. The forest presentation renderer uses existing `P`, `CAMP`, `IMPACT`, `projects`, `alloc`, `inr`, `dcat` and `go` bindings. It wraps existing route output in presentation-only page shells and does not replace the data/authentication layer. Core `go()` creates navigation markup; the presentation owner only marks the current item and does not rebuild the menu.

## Refactor completed

- The editorial script no longer replaces the homepage, rebuilds navigation/footer or wraps `go()`. Its previous route-shell wrapper was removed so it cannot nest around every page.
- The forest-luxury script is the sole active presentation override for homepage, Projects, Education, dedicated route mastheads/page shells, footer and active-navigation state. The core router owns the only navigation markup renderer.
- Public route shells now cover About, rescue listing/detail, Impact, Transparency, Donate, Volunteer, Contact, Stories, Education, Projects and policy routes. Team and Founder routes receive their own responsive dashboard treatment without changing role or data handlers.
- Homepage hero copy now follows the approved central message and supporting description. The cinematic animal photograph remains illustrative.
- The modern-upgrade script no longer injects a second homepage gallery or a separate donation panel. It is retained for interaction enhancements only.
- Presentation-script food/meal photographs were replaced with animal imagery.
- Sindhi locale metadata now identifies the Arabic-derived script and uses RTL document direction. Its short UI dictionary entries were changed to Sindhi-script text; human linguistic review is still required.

## Dependencies that remain intentionally in place

- The forest presentation renderer depends on the core global application bindings listed above. Do not convert it to a module or move its load position without migrating those dependencies.
- The private-photo and locale scripts depend on the DOM and application state initialized by `index.html`.
- Existing route handlers and all data/payment/security functions remain in `index.html`; this refactor does not migrate them.

## Verification boundary

Static regression checks can verify ownership markers, syntax, locale metadata and prohibited image references. They cannot establish that routes render correctly, that script timing is race-free, or that Founder/Team permissions and Supabase workflows behave correctly. A GitHub-hosted Chromium workflow serves the repository from a local development preview. Run `45379061260` completed successfully on commit `cfe25a8c6200593993279a8dbe3b953ea5d27be4`: 23 routes × 7 viewport widths (161 route/viewport checks), 10 locale-direction switches, the mobile menu and the unauthenticated Founder gate. The report recorded zero route/layout errors, zero horizontal overflow, zero browser console/page errors and zero failed HTTP responses; screenshot/report artifact `veganfarm-browser-audit` was uploaded. The audit checks that the language selector updates `lang`/`dir` and shows a partial-translation notice; it does not prove full translation coverage. It does not submit forms, initiate payments or authenticate as Team/Founder. The Team view in the unauthenticated screenshot is the access-code gate, not an authenticated Team dashboard. Rescue listings were empty in this anonymous preview because the public data source is restricted; a populated live rescue-case view was not verified. Staging and full role-isolation tests remain mandatory before merging or deploying.
