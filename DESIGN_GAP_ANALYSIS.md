# Design & Production-Readiness Gap Analysis

**Scope:** what stands between the current UI and a product you can sell.
**Date:** 2026-07-16
**Reference point:** Odoo's signup/onboarding flow (the comparison that prompted this).
**Companion doc:** [`INVENTORY_GAP_ANALYSIS.md`](INVENTORY_GAP_ANALYSIS.md) covers the domain/data layer. This one covers UI, UX, and commercial readiness.

---

## 1. Verdict

The app is **visually clean but commercially incomplete**. The design isn't ugly — the token system, spacing, and typography are coherent. What's missing is everything *around* the design that signals "this is a product" rather than "this is an internal tool":

1. **You cannot actually sell it.** There is no billing, no plans, no pricing, no subscription, no Terms, no Privacy Policy anywhere in the codebase. That is not a design gap — it's the literal blocker on "so I can sell."
2. **The first impression is a bare form on an empty canvas.** No brand, no value proposition, no context, no trust signals. Odoo's equivalent page does eight jobs; yours does one.
3. **The app has no failure states.** Zero skeletons, zero error boundaries, no `error.tsx`, `loading.tsx`, or `not-found.tsx`. A thrown error or a bad URL drops the user onto Next.js's raw default page.
4. **An expired session silently traps the user.** The 401 handler is commented out.

None of this is hard. It's mostly unglamorous work that has been deferred.

---

## 2. The reference comparison

What Odoo's signup does that ours doesn't:

| Odoo | Ours |
|---|---|
| Product nav (Applications, Industries, Pricing, Help) | none — the page is an island |
| Headline "Get Started" with brand treatment | "Create your account" |
| **Value prop: "Free instant access. No credit card required."** | none |
| Product context ("Stock" app + icon + change selection) | none |
| Qualifying fields (company, country, size, interest) | name, email, password |
| **Legal consent: "you accept our Subscription Agreement and Privacy Policy"** | none — *legally required to sell* |
| Live chat / support affordance | none |
| Phone with country code | none |

The gap isn't "make it prettier." It's that a signup page is a **conversion surface** and ours is a data-entry form.

---

## 3. Category A — Commercial readiness (blocks selling)

**Severity: critical. Nothing else on this list matters if these are missing.**

| Missing | Why it blocks the sale |
|---|---|
| **Billing / payments** | No way to charge anyone. No Stripe, no plans, no subscription state. Verified absent. |
| **Plans & entitlements** | No concept of tiers, limits, or what a paying org gets vs a free one. |
| **Pricing page** | No pricing surface anywhere. |
| **Terms of Service** | Legally required to sell SaaS. Absent. |
| **Privacy Policy** | Legally required (and you collect email, phone, address, IP, and device data via `LoginActivity`). Absent. |
| **Trial / free tier logic** | No trial state, no expiry, no upgrade path. |
| **Onboarding** | No product tour, no empty-state guidance, no "first run" experience. A new user lands on an empty dashboard with no next step. |
| **Support surface** | No help, docs, or contact channel. |

> Practical note: your `Organization` model has no `plan`, `trialEndsAt`, `subscriptionStatus`, or `seats`. Selling requires that vocabulary to exist before any UI can express it.

---

## 4. Category B — First impression (auth & onboarding)

**Severity: high**

The five auth pages (login, register, forgot-password, reset-password, organization) are a single centered `.glass` card on an empty canvas.

Gaps:
- **No brand presence.** No logo, no product name, no tagline on login/register. The org page shows a logo only after the org exists.
- **No value proposition.** Nothing tells a visitor what this product does.
- **No layout structure.** A professional auth page is typically split: form on one side, brand/benefit/social proof on the other. Ours is a form in a void.
- **No trust signals.** No testimonial, customer logos, security note, or "no credit card required".
- **Weak password policy.** Minimum **6 characters** (`register/page.tsx:29`), no strength meter, no breach check, no complexity guidance.
- **Link color is off-brand.** "Already have an account?" renders blue (`text-info`) on a teal-branded product. Links should be `text-primary`.
- **No social/SSO options.** Google/Microsoft sign-in is table stakes for B2B SaaS.
- **No email verification.** Registration issues a JWT immediately; the address is never confirmed.

---

## 5. Category C — Design system consistency

**Severity: high**

The token system (added 2026-07-16) is solid, but the component layer isn't finished.

### 5.1 Native OS controls bypass the design system
**10 occurrences** of raw `<select>` and `<input type="date">` — despite a styled shadcn `Select` existing at `components/ui/select.tsx`.

Visible on the dashboard: the "Select Range" dropdown and `dd/mm/yyyy` date fields render as unstyled macOS/Windows widgets that ignore the theme entirely. This is the single most obvious "unfinished" tell in the product.

Locations: `dashboard/DateFilter.tsx:63,78`, `accounts/page.tsx:168,180`, `settings/OtherSection.tsx:214,221,228`, `settings/dialogs/InviteMemberDialog.tsx:140`, `quick-entries/QuickEntryDialog.tsx:89`.

**Missing components:** no DatePicker, no Combobox/Autocomplete, no Skeleton, no Tooltip, no Pagination, no EmptyState, no Badge, no Avatar (avatars are hand-rolled gradient divs in 6+ places), no Breadcrumb.

### 5.2 Hardcoded colors in charts
`DashboardCharts.tsx:67` uses `fill="#14b8a6"` directly, bypassing the tokens. Charts won't follow the theme.

---

## 6. Category D — Data visualization

**Severity: high — these are misleading, not just ugly**

Checked against the dataviz method (form → color → validate → marks → interaction → a11y).

### 6.1 A single data point rendered as a bell curve
`DashboardCharts.tsx:45` uses `type="monotone"` on the AreaChart. With one real month of data, the spline interpolates a smooth curve that **implies data that does not exist** — it reads as a rise-and-fall trend when there is exactly one value. This is a correctness problem: the chart lies.

Fix: `type="linear"` (or `step`), and for a single point render a dot or a stat tile — not a curve. *The right form for one number is not a chart.*

### 6.2 A bar chart that is one giant block
`DashboardCharts.tsx:67` — `<Bar>` with no `maxBarSize`. One category expands to fill the entire plot area, producing a solid teal rectangle that communicates nothing.

Fix: `maxBarSize` (~32–48px), left-aligned, with a 2px surface gap between bars.

### 6.3 Systemic chart gaps
- **No empty state.** Zero data still renders axes and an empty frame instead of "No sales yet."
- **No tooltips/hover layer** on either chart — an HTML chart should be interactive by default.
- **No currency formatting** on axes (raw `140`, not `BDT 140`), no thousands separators.
- **No legend/direct labels**, no axis titles.
- **Colors bypass tokens** (§5.2) and were never validated for contrast or CVD.
- **Grid is not recessive** — dotted grid competes with the data.

---

## 7. Category E — State coverage

**Severity: high**

| State | Status |
|---|---|
| **Loading** | **0 skeletons** app-wide. Pages show `"Checking organization..."` as bare text, or nothing. |
| **Error** | **0 ErrorBoundary**, no `error.tsx` route. A render error = Next.js's default error screen. |
| **404** | No `not-found.tsx`. A bad URL = framework default. |
| **Route loading** | No `loading.tsx` anywhere. |
| **Empty** | Partial. Some pages have empty cards; charts and most tables don't. |
| **Offline / network failure** | Unhandled. |
| **Session expiry** | **Broken** — see below. |

### 7.1 Expired sessions trap the user
`lib/api/http.ts:56-59`:

```ts
if (err?.response?.status === 401) {
  // Optionally clear on unauthorized
  // clearAuthToken()
}
```

The handler is commented out. When a token expires (7 days), every request 401s, the UI shows generic failures, and the user is never redirected to login. They must clear storage manually. **This is a production bug, not a design nit.**

---

## 8. Category F — Accessibility

**Severity: medium-high (a legal requirement in many markets)**

- **11 `aria-label`s** and **6 `role=`** attributes across 64 components — far too few.
- **8 `<img>`** elements; the sidebar/settings logos use `alt="Logo"`, which is meaningless to a screen reader. The dashboard screenshot shows a **broken logo** rendering its alt text — a visible defect.
- **No focus-visible audit.** Buttons/inputs inherit `focus-visible:ring-ring`, but custom clickable `<div>`s do not.
- **Clickable non-interactive elements** — at least one `<div onClick>` with no role/tabIndex/keyboard handler.
- **No skip-to-content link**, no landmark regions.
- **Color-only status.** Stock and status are communicated by color alone (green/red), with no icon or text — fails CVD users and the dataviz status rule.
- **Contrast not audited** beyond the token pass I ran.

---

## 9. Category G — Internationalization

**Severity: medium**

The app ships English + Bengali (`next-intl`), but only **25 of 64** components call `t()`. The remaining ~39 have hardcoded English. Concretely: the entire auth flow ("Create your account", "Start by entering your details", "Register"), the organization page, and most modal copy are English-only.

Also missing: number/currency localization (BDT formatting is manual), date localization, and Bengali numeral support. `[lang="bn"]` sets a font but the content behind it is largely untranslated.

Selling to a Bengali market with half a translation is worse than shipping English only.

---

## 10. Category H — Responsive & mobile

**Severity: medium**

Breakpoint usage across the app: **73 `md:`, 20 `sm:`, 4 `lg:`, 1 `xl:`**. The layouts collapse for tablet but barely adapt above it, and the tail (`lg`/`xl`) is essentially unused — wide screens get the same cramped grid.

- Tables have no mobile strategy (no card fallback, no horizontal scroll container).
- The sidebar is fixed-width 64 with a mobile drawer in `AppShell`, but data pages assume desktop width.
- No touch-target audit (44px minimum).

---

## 11. Category I — Information hierarchy

**Severity: medium**

From the dashboard screenshot:
- **Eight stat tiles at identical visual weight.** Nothing is primary. "Total Revenue" and "Transport Revenue" compete equally. A dashboard should have one hero number and supporting detail.
- **No page descriptions or breadcrumbs** — every page is a bare title.
- **"Stocked Product Price" is masked (`*****`)** with an eye toggle, unexplained.
- **Greeting "Good night"** occupies prime real estate above the KPIs.
- **Empty metrics show `BDT 0`** with no guidance on how to make them non-zero.

---

## 12. Roadmap

Ordered by "can I sell it?" rather than by polish.

### Phase 0 — Correctness (days)
1. Fix the 401 handler: clear token, redirect to login, toast the reason. (§7.1)
2. Add `error.tsx`, `not-found.tsx`, `loading.tsx` at the locale root. (§7)
3. Fix the two misleading charts: `type="linear"`, `maxBarSize`, empty states, token colors. (§6)
4. Replace the 10 native `<select>`/date inputs with the existing `Select` + a real DatePicker. (§5.1)
5. Fix the broken logo and give images meaningful `alt`. (§8)
6. Link color → `text-primary`. (§4)

### Phase 1 — Sellable (weeks)
7. `Organization.plan` / `subscriptionStatus` / `trialEndsAt` / `seats` in the schema.
8. Stripe integration: checkout, webhooks, customer portal.
9. Pricing page, plan gating, upgrade path.
10. **Terms of Service + Privacy Policy** — non-negotiable.
11. Email verification on register; stronger password policy.

### Phase 2 — Professional first impression (weeks)
12. Redesign auth as a split brand/form layout with value prop and trust signals. (§4)
13. First-run onboarding: guided setup, sample data, empty-state CTAs.
14. Skeletons for every async surface. (§7)
15. Missing components: DatePicker, Skeleton, EmptyState, Pagination, Badge, Avatar, Tooltip, Breadcrumb. (§5.1)

### Phase 3 — Depth (ongoing)
16. Full i18n coverage; currency/date/numeral localization. (§9)
17. Accessibility pass to WCAG 2.1 AA. (§8)
18. Dashboard hierarchy: one hero metric + supporting tiles. (§11)
19. Responsive/mobile pass incl. table strategy. (§10)
20. SSO (Google/Microsoft). (§4)

---

## 13. Evidence index

| Claim | Location / method |
|---|---|
| No billing/plans/pricing/terms/privacy | grep across `frontend/src` — all absent |
| 401 handler commented out | `frontend/src/lib/api/http.ts:56-59` |
| 0 skeletons, 0 ErrorBoundary | grep count = 0 |
| No `error.tsx` / `loading.tsx` / `not-found.tsx` | no matches under `src/app` |
| 10 native `<select>` / date inputs | `DateFilter.tsx:63,78`, `accounts/page.tsx:168,180`, `OtherSection.tsx:214,221,228`, `InviteMemberDialog.tsx:140`, `QuickEntryDialog.tsx:89` |
| Spline through one data point | `DashboardCharts.tsx:45` (`type="monotone"`) |
| Bar with no size cap | `DashboardCharts.tsx:67` |
| Hardcoded chart color | `DashboardCharts.tsx:67` (`fill="#14b8a6"`) |
| Password min 6 chars | `register/page.tsx:29` |
| i18n coverage 25/64 files | grep `useTranslations|getTranslations` |
| Breakpoints 73 md / 20 sm / 4 lg / 1 xl | grep count |
| 11 aria-label, 6 role= | grep count |
| Broken logo rendering alt text | dashboard screenshot, both themes |
