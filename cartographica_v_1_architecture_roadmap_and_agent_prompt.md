# Cartographica V1 — Architecture, Roadmap, and Agent Prompt

## Goal

Transform the freshly forked Terraink codebase into **Cartographica**, a commercially branded, AGPL-compliant custom map print MVP that can be made real in **2–3 days**.

This is **not** a full ecommerce rebuild. V1 should preserve the existing Terraink map-generation strengths and wrap them in the minimum viable product needed to:

1. rebrand the app,
2. save generated designs later if needed,
3. support a clean customization and export flow,
4. prepare for checkout/account integration,
5. stay inside the existing architecture instead of fighting it.

## What Already Exists in the Fork

The fork already provides:

- custom city map posters for any location,
- geocoding and coordinate search,
- theme system,
- map layer styling,
- typography controls,
- PNG export,
- a feature-based clean architecture,
- a `PosterContext` single source of truth,
- service wiring through `src/core/services.ts`.

The codebase is split into feature slices under `src/features/` with `domain/`, `application/`, `infrastructure/`, and `ui/` layers. State is centered around `PosterContext`, and side effects live in hooks like `useFormHandlers`, `useMapSync`, `useLocationAutocomplete`, and `useExport`. Core I/O is already centralized in `src/core/services.ts`.

## V1 Product Scope

### What Cartographica V1 IS

A branded custom map print generator with:

- Cartographica branding,
- cleaned-up landing/editor experience,
- title / subtitle / date customization,
- location search,
- theme/layout customization,
- export options,
- AGPL/source attribution footer,
- placeholder paths for account and checkout,
- optional lightweight "save design" support if the codebase allows it cleanly.

### What Cartographica V1 is NOT

Do **not** try to build all of this in the first 2–3 days:

- full print-on-demand provider integration,
- full Stripe checkout,
- full Clerk auth,
- order management backend,
- gift messaging flows,
- admin dashboard,
- multi-tenant store engine,
- deep SEO/blog system,
- complex template marketplace.

That is how you turn a weekend sprint into a small funeral.

## Recommended V1 Strategy

### Product framing

Cartographica V1 should be a **premium custom map poster creator** with a homepage and editor.

Primary user flow:

1. land on homepage,
2. click Create Your Map,
3. search for location,
4. customize map/poster,
5. export print-ready asset,
6. optionally save design,
7. later connect checkout.

### Why this scope

The upstream project already handles the hard visual engine. The fastest path is to:

- **keep the engine**,
- **replace the brand**,
- **remove/confine upstream-specific marketing clutter**,
- **create a proper Cartographica shell**,
- **prepare extension points for account/checkout**.

## Proposed Architecture for Cartographica V1

### Principle

Do **not** break the existing Terraink architecture.

Keep the feature-based hexagonal/clean design:

- `domain/` for types and ports,
- `application/` for hooks/use cases,
- `infrastructure/` for adapters,
- `ui/` for components.

Do **not** put business logic in `App.tsx`.
Do **not** bypass `PosterContext`.
Do **not** call network/browser storage directly in UI if the codebase already routes that through services/adapters.

## Recommended V1 Module Plan

### 1. Brand / shell layer

**New or updated concerns:**

- app name: Cartographica
- logo usage
- header/nav
- footer with Source / Licenses / Attribution
- homepage hero and CTA
- legal attribution page

**Suggested feature bucket:**
- keep this mostly in `shared/ui/`, app shell components, and static content/data files unless there is already a more obvious place.

### 2. Poster editor flow

Reuse existing features:

- `location/`
- `map/`
- `theme/`
- `layout/`
- `poster/`
- `export/`

V1 objective is mostly UX refinement and rewording, not re-platforming.

### 3. Cartographica metadata fields

If not already represented cleanly in the form state, add minimal poster metadata fields to the `PosterContext`/reducer flow:

- `title`
- `subtitle`
- `dateLabel`
- `occasion` (optional)
- `orientation` if not already present

These should be added through the existing reducer/action patterns, not bolted on ad hoc.

### 4. Save design seam

Only if it can be done quickly and cleanly.

V1 can implement one of these:

- **Option A:** local draft save only
- **Option B:** no persistence yet, but clear TODO seam via port/interface

Preferred if time is tight: build the **port and stub seam**, not the full persistence feature.

Example concept:

- `src/features/poster/domain/ports.ts`
- `IPosterDraftRepository`

Then either:

- localStorage adapter in infrastructure, or
- a noop/in-memory adapter behind core services.

### 5. Checkout seam

Do not build full checkout yet.

Instead, add a clear integration seam:

- `BuyPrintButton` / `CheckoutCTA` component
- temporary behavior: opens placeholder modal or routes to `/coming-soon`
- later can swap to Stripe or print checkout.

## Suggested V1 Route Structure

Use the existing app shape if routing already exists. If adding routes is easy, keep them minimal:

- `/` — homepage
- `/editor` — map/poster creator
- `/licenses` — AGPL and source code page
- `/attribution` — map/data attribution page
- `/about` — optional, only if quick

Avoid building a giant route tree.

## Suggested UI Structure

### Homepage

Sections:

- hero
- 3-step how it works
- featured poster examples
- CTA to editor
- footer with compliance links

### Editor

Left or sidebar controls:

- location
- title/subtitle/date
- theme/style
- labels/typography
- export actions

Main pane:

- map/poster preview

Top utility:

- brand/logo
- create new / reset / maybe save draft

### Footer

Required links:

- Source Code
- Open-Source Licenses
- Map Data Attribution

Recommended text:

- “Cartographica is based on Terraink source code.”

## Data Model Additions for V1

Keep it tiny.

### PosterDraft

```ts
export interface PosterDraft {
  id: string;
  title: string;
  subtitle?: string;
  dateLabel?: string;
  locationQuery?: string;
  lat: number;
  lng: number;
  zoom?: number;
  themeId?: string;
  layoutId?: string;
  orientation?: 'portrait' | 'landscape';
  updatedAt: string;
}
```

Only add fields that are already representable in the UI/editor state.

## V1 Feature Priorities

### P0 — Must ship

1. Rebrand Terraink → Cartographica everywhere user-facing.
2. Remove/replace Terraink-specific marketing and badges.
3. Keep legal attribution and source/license links.
4. Ensure editor works end-to-end.
5. Preserve export flow.
6. Add homepage + CTA.
7. Add `/licenses` and `/attribution` pages.

### P1 — Strongly recommended

1. Add title/subtitle/date polish.
2. Add example poster presets / featured occasions.
3. Add placeholder save draft seam.
4. Add placeholder checkout CTA.

### P2 — Nice if time remains

1. local draft save
2. lightweight “recent designs”
3. simple product options panel (digital / print placeholder)
4. basic analytics hooks/events if already easy

## 2–3 Day Roadmap

## Day 1 — Rebrand and stabilize

### Objectives

- Get Cartographica branded and running.
- Preserve existing poster generation flow.
- Remove upstream-specific public-facing clutter.

### Tasks

- Fork repo and run locally.
- Search all references to Terraink in UI strings, meta tags, docs surfaced in app, badges, footer, page titles.
- Replace branding with Cartographica.
- Preserve AGPL/license/trademark-origin truth in legal pages.
- Remove social/product-hunt/star-marketing clutter from visible UI unless intentionally reused.
- Create a simple homepage shell with CTA to editor.
- Confirm exports still work.

### Deliverable

A branded Cartographica app that still functions as a map poster creator.

## Day 2 — MVP productization

### Objectives

- Make it feel like a product, not just a fork.

### Tasks

- Improve editor labels and UX copy.
- Add title/subtitle/date controls if needed.
- Add featured preset occasions as simple content data:
  - Where We Met
  - Wedding Venue
  - First Home
  - Hometown
  - Anniversary Trip
- Add compliance footer links.
- Add `/licenses` page.
- Add `/attribution` page.
- Add placeholder checkout CTA.

### Deliverable

A believable MVP with homepage, editor, legal pages, and product framing.

## Day 3 — Polish and extension seams

### Objectives

- Prepare handoff for next phase.

### Tasks

- Add draft-save seam or lightweight local persistence.
- Clean up obvious naming/architecture issues.
- Confirm no logic was improperly added to `App.tsx`.
- Confirm imports obey feature boundaries.
- Add TODO stubs for:
  - auth
  - checkout
  - order pipeline
  - account page
- smoke test build and export.

### Deliverable

A stable V1 fork that is ready for either:

- direct launch as a digital-only MVP, or
- next-phase auth/checkout integration.

## Phase 2 After the Sprint

Only after V1:

- Clerk or Supabase auth
- My Account / Saved Designs
- Stripe checkout
- print provider integration
- reorder flow
- email delivery of digital downloads
- SEO pages for gift occasions

## Implementation Rules for the Agent

1. **Do not invent paths or APIs. Read files first.**
2. **Do not collapse the existing clean architecture into random component state.**
3. **Do not add direct infrastructure calls in UI components.**
4. **Do not overbuild checkout/auth right now.**
5. **Do not rename internal architectural structures unless necessary.**
6. **Prioritize shipping a clean branded MVP over ideal long-term system design.**
7. **Every change must preserve or improve the working editor/export flow.**

## Recommended Work Breakdown for the Agent

### Workstream A — Brand conversion

- Rename app strings and visible references.
- Add Cartographica logo/wordmark.
- Update page metadata/title/description.
- Replace homepage and footer content.

### Workstream B — Product UI

- Refine homepage.
- Refine editor labels and panel naming.
- Add occasion presets.
- Add CTA buttons.

### Workstream C — Legal/compliance

- Add source code link.
- Add licenses page.
- Add attribution page.
- Preserve upstream legal notices where required.

### Workstream D — Extension seams

- Draft save interface
- Checkout CTA placeholder
- Account placeholder route or TODO markers

## Definition of Done for V1

Cartographica V1 is done when:

- the app runs locally,
- Terraink branding is removed from user-facing product surfaces,
- required attribution/compliance links are present,
- the map editor still works,
- export still works,
- there is a decent homepage,
- there is a clear CTA into the editor,
- the code changes respect the existing architecture,
- the fork feels like a product instead of a repo demo.

## Copy-Paste Agent Prompt

```md
You are working on a freshly forked codebase from Terraink to create a branded MVP called Cartographica.

Your job is to transform the existing map poster engine into a launchable V1 in 2–3 days without breaking the current architecture.

Read the actual source files before making changes. Do not invent file paths, exports, hooks, types, or APIs.

### Product Goal
Build Cartographica V1: a premium custom map poster creator with:
- Cartographica branding
- homepage + CTA
- working editor
- title / subtitle / date customization
- preserved export flow
- AGPL/source/license/attribution footer links
- placeholder seams for save draft and checkout

### Architectural Constraints
Respect the existing feature-based clean architecture:
- `src/features/*/{domain,application,infrastructure,ui}`
- `PosterContext` remains the single source of truth
- side effects stay in application hooks
- I/O goes through `src/core/services.ts`
- do not put business logic in `App.tsx`
- do not import infrastructure directly into UI
- use `@/` alias for cross-feature imports

### Existing strengths to preserve
- location search/geocoding
- map rendering
- themes and styling
- typography controls
- export flow

### Priority Order
1. Rebrand user-facing Terraink references to Cartographica.
2. Create a clean homepage and footer.
3. Keep the editor working.
4. Add `/licenses` and `/attribution` pages.
5. Add title/subtitle/date polish if needed.
6. Add simple occasion presets.
7. Add a clean placeholder checkout CTA.
8. If time allows, add a save-draft seam or local draft save.

### Must Not Do
- do not attempt full auth implementation
- do not attempt full Stripe checkout
- do not add admin systems
- do not restructure the whole repo unnecessarily
- do not remove required legal attribution

### Deliverables
- working Cartographica branding
- homepage
- editor route/flow
- compliance footer
- legal pages
- preserved export flow
- clean commit-ready code

### Working Style
Work incrementally.
After inspecting the relevant files, propose the exact files to edit before making large changes.
Prefer small, composable changes over sweeping rewrites.
When uncertain, preserve the upstream architecture instead of improvising.
```

## Final Recommendation

Build **Cartographica as a branded shell around the existing Terraink poster engine**, not as a new ecommerce platform yet.

That gets you something real in days instead of a beautiful pile of future intentions.

