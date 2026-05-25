# Professional Engagement Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 10 recommended UX, engagement, conversion, and professional polish upgrades for the Adria Cross Edit static Next.js site.

**Architecture:** Keep the site static-only and App Router based. Add reusable, typed local content for proof, process, CTAs, and service comparison data, then render that content through existing page/component patterns without adding a CMS, API route, database, or client-only state where native HTML works.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS 4 via `src/app/globals.css`, Vitest, ESLint, static export, Google Appointment Schedule.

---

## Scope

This plan implements all 10 recommendations:

1. Sticky header CTA.
2. CTA on every service card.
3. Homepage proof section.
4. "How It Works" section.
5. Easier service comparison.
6. Remove developer-facing blog note.
7. Blog-to-booking paths.
8. Mobile navigation polish.
9. Focus-visible accessibility states.
10. Secondary accent and visual polish.

No new third-party dependency is required.

## Target File Structure

Modify:

```text
src/app/page.tsx
src/app/services/page.tsx
src/app/contact/page.tsx
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
src/app/globals.css
src/components/BlogCard.tsx
src/components/ServiceCard.tsx
src/components/SiteHeader.tsx
src/components/SiteFooter.tsx
src/lib/services.ts
```

Create:

```text
src/lib/engagement.ts
src/lib/engagement.test.ts
```

Run:

```text
npm test
npm run lint
npm run typecheck
npm run build
```

## Design Decisions

- Do not invent client testimonials. Until Adria has approved quotes, use "client outcome" proof cards that describe concrete deliverables and results without pretending to quote clients.
- Keep conversion routes internal where possible: primary CTAs go to `/contact/`; the contact page owns the Google Calendar embed and email fallback.
- Use a native `<details>` mobile menu so the static export remains simple and accessible without a client component.
- Keep the warm brand foundation, but introduce a muted burgundy secondary accent for proof/CTA moments so the site stops reading as one-note beige/brown.
- Preserve current real photography and current page structure. The work is an upgrade pass, not a redesign.

---

## Task 1: Add Engagement Content Contracts

**Files:**
- Modify: `src/lib/services.ts`
- Create: `src/lib/engagement.ts`
- Create: `src/lib/engagement.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/engagement.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  blogConversionCta,
  clientOutcomes,
  finalConversionCta,
  processSteps,
  trustSignals,
} from "./engagement";
import { services } from "./services";

describe("engagement content", () => {
  it("adds conversion metadata to every service", () => {
    for (const service of services) {
      expect(service.duration.length).toBeGreaterThan(0);
      expect(service.bestFor.length).toBeGreaterThan(0);
      expect(service.includes.length).toBeGreaterThanOrEqual(3);
      expect(service.ctaLabel).toMatch(/Book|Start|Plan/);
    }
  });

  it("defines homepage proof and process content", () => {
    expect(trustSignals).toHaveLength(3);
    expect(clientOutcomes).toHaveLength(3);
    expect(processSteps).toHaveLength(4);
  });

  it("defines clear conversion CTAs", () => {
    expect(finalConversionCta.href).toBe("/contact/");
    expect(blogConversionCta.href).toBe("/contact/");
    expect(finalConversionCta.label).toMatch(/consult/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/lib/engagement.test.ts
```

Expected: FAIL because `src/lib/engagement.ts` does not exist and `services` do not yet expose `duration`, `bestFor`, `includes`, or `ctaLabel`.

- [ ] **Step 3: Add engagement content**

Create `src/lib/engagement.ts`:

```ts
export const trustSignals = [
  {
    value: "4",
    label: "focused styling services",
  },
  {
    value: "20 min",
    label: "free closet consult",
  },
  {
    value: "Virtual + local",
    label: "flexible styling support",
  },
] as const;

export const clientOutcomes = [
  {
    title: "A clearer closet",
    copy:
      "Know what stays, what needs tailoring, what can go, and which pieces deserve the next purchase.",
  },
  {
    title: "Repeatable outfit formulas",
    copy:
      "Leave with practical combinations you can use for work, weekends, travel, and events.",
  },
  {
    title: "Shopping with a filter",
    copy:
      "Use color, fit, lifestyle, and wardrobe gaps to stop buying pieces that never earn their place.",
  },
] as const;

export const processSteps = [
  {
    title: "Free consult",
    copy:
      "Talk through your wardrobe goals, current friction points, and which service fits best.",
  },
  {
    title: "Closet review",
    copy:
      "Edit what you own, identify fit issues, spot missing essentials, and preserve the pieces that still work.",
  },
  {
    title: "Style plan",
    copy:
      "Build outfit formulas, color direction, shopping priorities, and a practical next-step list.",
  },
  {
    title: "Confident repeat",
    copy:
      "Use the plan for daily dressing, upcoming events, seasonal refreshes, and better future purchases.",
  },
] as const;

export const finalConversionCta = {
  eyebrow: "Ready For Less Closet Friction?",
  title: "Start with a free 20-minute consult.",
  copy:
    "Bring the pieces, habits, and style questions that keep slowing you down. Adria will help you choose the right next step.",
  label: "Book a free consult",
  href: "/contact/",
} as const;

export const blogConversionCta = {
  eyebrow: "Turn Advice Into Outfits",
  title: "Want help applying this to your own closet?",
  copy:
    "A free consult is the easiest way to turn general styling advice into a plan for your body, schedule, and wardrobe.",
  label: "Book a free consult",
  href: "/contact/",
} as const;
```

- [ ] **Step 4: Extend service data**

Replace the entries in `src/lib/services.ts` with this structure while preserving existing IDs, names, prices, images, and hrefs:

```ts
export const services = [
  {
    id: "closet-edit",
    name: "Closet Edit",
    summary:
      "A focused wardrobe review that turns what you already own into wearable outfits and clearer next purchases.",
    details:
      "A two-hour session to curate complete outfits, identify what is missing, and give your closet a more confident rhythm.",
    price: "Starting at $395",
    duration: "Two-hour focused session",
    bestFor: "Closets that are full but still feel hard to use",
    includes: [
      "Keep, tailor, donate, and replace guidance",
      "Outfit combinations from pieces you already own",
      "A short list of missing wardrobe priorities",
    ],
    ctaLabel: "Book a closet edit",
    image: "/images/adria-services-new.jpg",
    href: "/services/#closet-edit",
  },
  {
    id: "wardrobe-overhaul",
    name: "Complete Wardrobe Overhaul",
    summary:
      "A larger wardrobe reset for clients who want their closet, shopping choices, and daily style to feel aligned.",
    details:
      "We refine what stays, source what is missing, and build a wardrobe that fits your lifestyle instead of working against it.",
    price: "Starting at $1,200",
    duration: "Multi-step wardrobe reset",
    bestFor: "Major life, body, career, or style transitions",
    includes: [
      "Deep edit of what earns closet space",
      "Wardrobe gap analysis and shopping direction",
      "Repeatable outfit formulas for daily life",
    ],
    ctaLabel: "Plan an overhaul",
    image: "/images/adria-extra-new.jpg",
    href: "/services/#wardrobe-overhaul",
  },
  {
    id: "personal-shopping",
    name: "Personal Shopping Experience",
    summary:
      "A guided shopping session built around your lifestyle, wardrobe gaps, and the pieces that actually earn their place.",
    details:
      "Ideal for targeted shopping, event preparation, seasonal refreshes, or learning how to shop with more clarity.",
    price: "$150/hour, 3-hour minimum",
    duration: "Three-hour minimum",
    bestFor: "Targeted purchases, seasonal refreshes, and event needs",
    includes: [
      "Shopping priorities based on your actual wardrobe",
      "Fit, proportion, and color guidance in real time",
      "Clear yes/no decision support while shopping",
    ],
    ctaLabel: "Start shopping smarter",
    image: "/images/adria-profile-new.jpg",
    href: "/services/#personal-shopping",
  },
  {
    id: "color-analysis",
    name: "Color Analysis",
    summary:
      "A practical color session that helps you understand which shades make your features look clearer and brighter.",
    details:
      "Includes palette guidance for clothes, makeup, and accessories so decisions become easier after the session.",
    price: "Starting at $200",
    duration: "Focused color session",
    bestFor: "Clients who want faster color, makeup, and shopping decisions",
    includes: [
      "Personal color direction for clothes and accessories",
      "Guidance for makeup and wardrobe accents",
      "Color guardrails for future purchases",
    ],
    ctaLabel: "Book color analysis",
    image: "/images/adria-contact-new.jpg",
    href: "/services/#color-analysis",
  },
] as const;
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm test -- src/lib/engagement.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/engagement.ts src/lib/engagement.test.ts src/lib/services.ts
git commit -m "feat: add engagement content model"
```

---

## Task 2: Add Service Card CTAs And Service Comparison

**Files:**
- Modify: `src/components/ServiceCard.tsx`
- Modify: `src/app/services/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update service cards to convert**

Replace `src/components/ServiceCard.tsx` with:

```tsx
import Link from "next/link";
import { MediaFrame } from "@/components/MediaFrame";
import type { services } from "@/lib/services";

type Service = (typeof services)[number];

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article id={service.id} className="service-card">
      <MediaFrame
        alt={`${service.name} styling service`}
        src={service.image}
        variant="card"
      />
      <div className="card-copy">
        <p className="eyebrow">{service.price}</p>
        <h2>{service.name}</h2>
        <p>{service.summary}</p>
        <dl className="service-meta">
          <div>
            <dt>Best for</dt>
            <dd>{service.bestFor}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{service.duration}</dd>
          </div>
        </dl>
        <ul className="service-includes">
          {service.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link className="button service-card__cta" href="/contact/">
          {service.ctaLabel}
        </Link>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Add a services hero CTA and comparison section**

Modify `src/app/services/page.tsx`:

```tsx
import Link from "next/link";
```

Add this inside the hero text after the second paragraph:

```tsx
<div className="button-row">
  <Link className="button" href="/contact/">
    Book a free consult
  </Link>
</div>
```

Add this section after the existing service grid section:

```tsx
<section className="section service-compare">
  <div>
    <p className="eyebrow">Compare Services</p>
    <h2>Choose the right level of wardrobe support.</h2>
  </div>
  <div className="comparison-grid">
    {services.map((service) => (
      <article key={service.id} className="comparison-card">
        <h3>{service.name}</h3>
        <p className="detail">{service.bestFor}</p>
        <dl className="service-meta">
          <div>
            <dt>Starting at</dt>
            <dd>{service.price}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{service.duration}</dd>
          </div>
        </dl>
        <Link className="text-link" href="/contact/">
          {service.ctaLabel}
        </Link>
      </article>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Add service CTA CSS**

Append to `src/app/globals.css` before `.site-footer`:

```css
.service-meta {
  display: grid;
  gap: 0.75rem;
  margin: 1rem 0;
}

.service-meta div {
  display: grid;
  gap: 0.15rem;
}

.service-meta dt {
  color: var(--color-accent-deep);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-meta dd {
  margin: 0;
  color: var(--color-muted);
}

.service-includes {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding-left: 1.1rem;
  color: var(--color-muted);
}

.service-card__cta {
  width: 100%;
}

.service-compare {
  display: grid;
  gap: 1.5rem;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.comparison-card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  padding: 1.2rem;
  box-shadow: var(--shadow-soft);
}

.comparison-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}
```

Add this inside the `@media (max-width: 900px)` block:

```css
.comparison-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

Add this inside the `@media (max-width: 640px)` block:

```css
.comparison-grid {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 4: Verify services page**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ServiceCard.tsx src/app/services/page.tsx src/app/globals.css
git commit -m "feat: improve service conversion paths"
```

---

## Task 3: Add Homepage Proof, Process, And Final CTA

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Import engagement content**

Add to `src/app/page.tsx`:

```tsx
import Link from "next/link";
import {
  clientOutcomes,
  finalConversionCta,
  processSteps,
  trustSignals,
} from "@/lib/engagement";
```

Keep the existing `Link` import if already present and avoid duplicate imports.

- [ ] **Step 2: Add proof strip after the hero**

Insert after the closing `</section>` of the hero:

```tsx
<section className="proof-strip" aria-label="Adria Cross Edit highlights">
  {trustSignals.map((signal) => (
    <div key={signal.label}>
      <strong>{signal.value}</strong>
      <span>{signal.label}</span>
    </div>
  ))}
</section>
```

- [ ] **Step 3: Add client outcomes after the existing service preview**

Insert after the "What I Do" section:

```tsx
<section className="section">
  <p className="eyebrow">Client Outcomes</p>
  <h2>What changes after the edit.</h2>
  <div className="outcome-grid">
    {clientOutcomes.map((outcome) => (
      <article key={outcome.title} className="outcome-card">
        <h3>{outcome.title}</h3>
        <p>{outcome.copy}</p>
      </article>
    ))}
  </div>
</section>
```

- [ ] **Step 4: Add "How It Works" after client outcomes**

```tsx
<section className="section">
  <p className="eyebrow">How It Works</p>
  <h2>A simple path from closet friction to daily clarity.</h2>
  <div className="process-grid">
    {processSteps.map((step, index) => (
      <article key={step.title} className="process-card">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <h3>{step.title}</h3>
        <p>{step.copy}</p>
      </article>
    ))}
  </div>
</section>
```

- [ ] **Step 5: Add final conversion band before the end of the page**

Insert before the closing fragment:

```tsx
<section className="cta-band">
  <p className="eyebrow">{finalConversionCta.eyebrow}</p>
  <h2>{finalConversionCta.title}</h2>
  <p>{finalConversionCta.copy}</p>
  <Link className="button" href={finalConversionCta.href}>
    {finalConversionCta.label}
  </Link>
</section>
```

- [ ] **Step 6: Add homepage section CSS**

Append to `src/app/globals.css` before `.site-footer`:

```css
.proof-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto 2rem;
}

.proof-strip div,
.outcome-card,
.process-card,
.cta-band {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: var(--shadow-soft);
}

.proof-strip div {
  display: grid;
  gap: 0.2rem;
  padding: 1rem;
}

.proof-strip strong {
  color: var(--color-secondary);
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 1;
}

.proof-strip span {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.outcome-grid,
.process-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.process-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.outcome-card,
.process-card {
  padding: 1.25rem;
}

.outcome-card h3,
.process-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.55rem;
}

.process-card span {
  display: inline-flex;
  margin-bottom: 1rem;
  color: var(--color-secondary);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.cta-band {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto 4rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  background:
    linear-gradient(135deg, rgba(122, 63, 77, 0.12), rgba(255, 255, 255, 0.86)),
    rgba(255, 255, 255, 0.78);
}

.cta-band h2 {
  margin: 0 0 0.75rem;
  font-size: clamp(2.2rem, 5vw, 4rem);
  line-height: 0.98;
}

.cta-band p {
  max-width: 62ch;
  color: var(--color-muted);
}
```

Add inside `@media (max-width: 900px)`:

```css
.proof-strip,
.outcome-grid,
.process-grid {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "feat: add homepage proof and process sections"
```

---

## Task 4: Add Header CTA And Mobile Navigation

**Files:**
- Modify: `src/components/SiteHeader.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace header markup**

Replace `src/components/SiteHeader.tsx` with:

```tsx
import Link from "next/link";
import { navigation } from "@/lib/navigation";
import { site } from "@/lib/site";

function NavLinks() {
  return (
    <ul className="nav-menu">
      {navigation.map((item) => (
        <li key={item.href}>
          <Link href={item.href}>{item.label}</Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label={`${site.name} home`}>
          <span className="brand-mark">AC</span>
          <span className="brand-copy">
            <strong>{site.owner}</strong>
            <span>Personal Stylist</span>
          </span>
        </Link>

        <div className="desktop-nav">
          <NavLinks />
          <Link className="button nav-cta" href="/contact/">
            Book Free Consult
          </Link>
        </div>

        <details className="mobile-nav">
          <summary aria-label="Open navigation">Menu</summary>
          <div className="mobile-nav__panel">
            <NavLinks />
            <Link className="button nav-cta" href="/contact/">
              Book Free Consult
            </Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Add navigation CSS**

Modify `src/app/globals.css` near the existing nav rules:

```css
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-cta {
  min-height: 40px;
  margin-top: 0;
  padding: 0.7rem 1rem;
  white-space: nowrap;
}

.mobile-nav {
  display: none;
}

.mobile-nav summary {
  cursor: pointer;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  background: rgba(255, 255, 255, 0.76);
  font-weight: 800;
  list-style: none;
}

.mobile-nav summary::-webkit-details-marker {
  display: none;
}

.mobile-nav__panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  display: grid;
  gap: 1rem;
  min-width: min(18rem, calc(100vw - 2rem));
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 250, 244, 0.98);
  padding: 1rem;
  box-shadow: var(--shadow-soft);
}
```

Replace the current `@media (max-width: 900px)` `.site-nav` block with:

```css
.site-nav {
  position: relative;
}

.desktop-nav {
  display: none;
}

.mobile-nav {
  display: block;
}

.mobile-nav .nav-menu {
  display: grid;
  gap: 0.65rem;
}

.mobile-nav .nav-cta {
  width: 100%;
}
```

- [ ] **Step 3: Verify keyboard path**

Run the dev server:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/`, press Tab through the header, and verify:

- Brand link receives a visible focus outline.
- Menu summary receives focus on narrow/mobile widths.
- Header CTA receives focus and links to `/contact/`.

- [ ] **Step 4: Commit**

```bash
git add src/components/SiteHeader.tsx src/app/globals.css
git commit -m "feat: add header booking CTA and mobile menu"
```

---

## Task 5: Improve Blog Engagement And Article Conversion

**Files:**
- Modify: `src/app/blog/page.tsx`
- Modify: `src/app/blog/[slug]/page.tsx`
- Modify: `src/components/BlogCard.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Remove developer-facing blog note**

In `src/app/blog/page.tsx`, replace:

```tsx
<p className="search-note">Search is generated at build time for static browsing and indexing.</p>
```

with:

```tsx
<div className="section-heading">
  <p className="eyebrow">Featured Guidance</p>
  <h2>Start with the wardrobe question you are already asking.</h2>
</div>
```

- [ ] **Step 2: Add a service path to blog cards**

Modify `src/components/BlogCard.tsx`:

```tsx
<div className="button-row">
  <Link className="text-link" href={`/blog/${post.slug}/`}>
    Read article
  </Link>
  <Link className="text-link blog-card__service-link" href="/services/">
    Match to a service
  </Link>
</div>
```

- [ ] **Step 3: Add article-level CTA**

In `src/app/blog/[slug]/page.tsx`, add imports:

```tsx
import Link from "next/link";
import { blogConversionCta } from "@/lib/engagement";
```

Add this after `<Markdown>{post.body}</Markdown>`:

```tsx
<section className="article-cta">
  <p className="eyebrow">{blogConversionCta.eyebrow}</p>
  <h2>{blogConversionCta.title}</h2>
  <p>{blogConversionCta.copy}</p>
  <Link className="button" href={blogConversionCta.href}>
    {blogConversionCta.label}
  </Link>
</section>
```

- [ ] **Step 4: Add blog CTA CSS**

Append to `src/app/globals.css` near the article rules:

```css
.section-heading {
  margin-bottom: 1.25rem;
}

.section-heading h2 {
  max-width: 720px;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1;
}

.blog-card__service-link {
  background: rgba(122, 63, 77, 0.08);
}

.article-cta {
  margin-top: 3rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(122, 63, 77, 0.12), rgba(255, 255, 255, 0.88)),
    rgba(255, 255, 255, 0.78);
  padding: clamp(1.25rem, 4vw, 2rem);
  box-shadow: var(--shadow-soft);
}

.article-cta h2 {
  margin: 0 0 0.75rem;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1;
}
```

- [ ] **Step 5: Verify blog copy**

Run:

```bash
rg -n "Search is generated|build time|static browsing" src/app src/components
```

Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add src/app/blog/page.tsx 'src/app/blog/[slug]/page.tsx' src/components/BlogCard.tsx src/app/globals.css
git commit -m "feat: add blog conversion paths"
```

---

## Task 6: Add Footer Conversion And Contact Fallbacks

**Files:**
- Modify: `src/components/SiteFooter.tsx`
- Modify: `src/app/contact/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add footer booking CTA**

In `src/components/SiteFooter.tsx`, add a booking link to `.footer-contact` before the email link:

```tsx
<Link className="button footer-cta" href="/contact/">
  Book Free Consult
</Link>
```

- [ ] **Step 2: Improve contact hero conversion choices**

In `src/app/contact/page.tsx`, replace the single email button with:

```tsx
<div className="button-row">
  <a className="button" href="#calendar">
    Choose a time
  </a>
  <a className="button ghost" href={`mailto:${site.email}`}>
    Email Adria
  </a>
</div>
```

Add `id="calendar"` to the calendar card:

```tsx
<div className="contact-card" id="calendar">
```

- [ ] **Step 3: Add footer CTA CSS**

Append to `src/app/globals.css` near footer rules:

```css
.footer-cta {
  align-self: flex-start;
  min-height: 40px;
  margin-top: 0;
  padding: 0.7rem 1rem;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SiteFooter.tsx src/app/contact/page.tsx src/app/globals.css
git commit -m "feat: strengthen contact and footer CTAs"
```

---

## Task 7: Add Accessibility And Visual Polish

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add secondary accent token**

Add to `:root` in `src/app/globals.css`:

```css
--color-secondary: #7a3f4d;
--color-secondary-deep: #552a35;
```

- [ ] **Step 2: Add focus-visible states**

Append after the base `a` rule:

```css
:where(a, button, summary, iframe, .button, .text-link):focus-visible {
  outline: 3px solid rgba(122, 63, 77, 0.48);
  outline-offset: 4px;
}
```

- [ ] **Step 3: Tighten card radii**

Update existing card radii:

```css
.media-frame {
  border-radius: 12px;
}

.service-card,
.blog-card,
.faq-card,
.contact-card,
.legal-card,
.panel-card {
  border-radius: 12px;
}

.article-shell img {
  border-radius: 12px;
}
```

- [ ] **Step 4: Respect reduced motion**

Append near the bottom of `src/app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Verify CSS has the new accent and focus state**

```bash
rg -n "color-secondary|focus-visible|prefers-reduced-motion" src/app/globals.css
```

Expected: matches for all three terms.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "style: improve focus states and visual polish"
```

---

## Task 8: Final Verification

**Files:**
- Read: all modified files
- Verify: generated `out/` build

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: PASS, including `src/lib/blog.test.ts` and `src/lib/engagement.test.ts`.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: PASS and static SEO verification succeeds.

- [ ] **Step 5: Launch local verification server**

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Expected: Next dev server starts at `http://127.0.0.1:3000`.

- [ ] **Step 6: Desktop visual QA**

Open these routes in Chrome at a desktop width:

```text
http://127.0.0.1:3000/
http://127.0.0.1:3000/services/
http://127.0.0.1:3000/contact/
http://127.0.0.1:3000/blog/
http://127.0.0.1:3000/blog/finding-your-signature-style/
```

Verify:

- Header CTA is visible and links to `/contact/`.
- Homepage shows proof strip, service cards, client outcomes, process, and final CTA.
- Service cards show `Best for`, `Time`, includes, and CTA.
- Services page includes comparison cards.
- Blog page no longer shows developer-facing build/search copy.
- Blog cards and article pages include conversion paths.
- No text overlaps or cards resize awkwardly.

- [ ] **Step 7: Mobile visual QA**

Resize Chrome to a narrow/mobile width and verify:

- Header shows brand plus compact menu.
- Mobile menu opens with navigation links and booking CTA.
- Hero type wraps cleanly.
- Service comparison collapses to one column.
- Proof/process/outcome cards are one column.
- CTA buttons do not overflow.

- [ ] **Step 8: Keyboard QA**

Using only the keyboard, verify:

- Skip link appears on first Tab.
- Header links, mobile menu summary, buttons, and article links have visible focus rings.
- Contact page calendar area can be reached after the hero CTA.

- [ ] **Step 9: Commit final verification notes if needed**

If verification uncovers minor CSS fixes, make them and commit:

```bash
git add src/app/globals.css
git commit -m "fix: polish responsive engagement sections"
```

- [ ] **Step 10: Final status**

Report:

- Tests run and pass/fail status.
- Build pass/fail status.
- Routes visually checked.
- Any content that still needs real client approval, especially testimonials if Adria wants quoted social proof later.

---

## Self-Review Checklist

- Recommendation 1 is covered by Task 4.
- Recommendation 2 is covered by Task 2.
- Recommendation 3 is covered by Task 3 using outcome proof cards instead of fabricated testimonials.
- Recommendation 4 is covered by Task 3.
- Recommendation 5 is covered by Task 2.
- Recommendation 6 is covered by Task 5.
- Recommendation 7 is covered by Task 5.
- Recommendation 8 is covered by Task 4.
- Recommendation 9 is covered by Task 7.
- Recommendation 10 is covered by Task 7.

No dynamic APIs, database work, CMS work, or new external dependencies are introduced.
