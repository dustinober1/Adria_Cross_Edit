# Next.js App Router Static Vercel SEO Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Adria Cross Edit as a professional static, SEO-first Next.js App Router website with no project-owned database, no Express server requirement, and a clean Vercel hosting path.

**Architecture:** Replace the current Express/static hybrid with a Next.js App Router + TypeScript site that uses build-time JSON content, static route generation, typed metadata, generated robots/sitemap output, and static assets. Dynamic workflows move to static-safe external services: Google Appointment Schedule, mail links, and future hosted provider links.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS 4, JSON blog content, `react-markdown`, `remark-gfm`, Vitest, ESLint, Vercel static export, Google Analytics.

---

## Current Repo Findings

- Current app is Express-based: [server.js](/Users/dustinober/customers/Adria_Cross_Edit/server.js) is 2,733 lines and owns sessions, auth, appointments, intake, newsletter, availability, blog editing, DB-backed image uploads, clothing matcher APIs, Square API calls, and static file serving.
- Current storage is database-heavy: `adria_cross.db`, `sessions.db`, `migrations/*.sql`, `better-sqlite3`, `sqlite`, `sqlite3`, `pg`, and `connect-sqlite3` are present.
- Current public pages are mostly static HTML already: `index.html`, `about.html`, `services.html`, `contact.html`, `blog.html`, `blog/index.html`, `privacy-policy.html`, `terms-of-service.html`, and `404.html`.
- Current dynamic browser calls use `/api/*` from `contact.html`, `intake-form.html`, `login.html`, `member-portal.html`, `admin.html`, `blog/index.html`, `clothing-matcher/`, `js/payments.js`, `js/auth.js`, and `js/main.js`.
- Current SEO needs consolidation: duplicate blog URLs exist under both `/blog/*.html` and `/blog/posts/*.html`; sitemap contains stale `lastmod` values; canonical URLs mix `.html`, `/blog/`, and duplicate post paths.
- Current assets are usable: `images/` contains hero, profile, services, contact, blog, logo, icon, JPG, PNG, and WebP files. `uploads/blog/` contains DB-era blog upload images that must become static assets if retained posts reference them.

## Documentation Basis

Context7 was used on 2026-05-24 for current Next.js and Vercel guidance.

- Next.js App Router supports static route generation through `generateStaticParams()`.
- Next.js App Router supports route metadata through static `metadata` exports and `generateMetadata()`.
- Next.js supports `app/robots.ts` and `app/sitemap.ts` metadata route files.
- Next.js `output: "export"` produces a fully static `out/` directory and disables server-only features.
- Static export does not support server-side Next features such as request-time route handlers, Server Actions, ISR, `next.config` redirects, `next.config` headers, cookies, or request-dependent dynamic rendering.
- Vercel can host the static `out/` output and can own platform redirects/headers through `vercel.json`.

## Key Direction Change From The Prior Plan

This plan intentionally aligns Adria with the maintainability pattern used in `sundee-fundee-web`: Next.js App Router, React, TypeScript, typed local content helpers, generated SEO surfaces, and repo-local validation scripts.

The critical difference from `sundee-fundee-web` is that Adria must remain static-only for this migration:

- No `src/app/api/**` routes.
- No Stripe server routes.
- No Supabase.
- No database migrations.
- No auth/session/admin surface.
- No custom server.

## Target URL Strategy

Use clean extensionless URLs with trailing slashes and preserve old ranking/link value with permanent Vercel redirects.

| Old URL | New URL |
| --- | --- |
| `/index.html` | `/` |
| `/about.html` | `/about/` |
| `/services.html` | `/services/` |
| `/contact.html` | `/contact/` |
| `/blog.html` | `/blog/` |
| `/blog/index.html` | `/blog/` |
| `/blog/posts/how-to-build-a-capsule-wardrobe.html` | `/blog/how-to-build-a-capsule-wardrobe/` |
| `/blog/how-to-build-a-capsule-wardrobe.html` | `/blog/how-to-build-a-capsule-wardrobe/` |
| `/blog/posts/mixing-patterns-like-a-pro.html` | `/blog/mixing-patterns-like-a-pro/` |
| `/blog/mixing-patterns-like-a-pro.html` | `/blog/mixing-patterns-like-a-pro/` |
| `/blog/posts/seasonal-color-trends-2025.html` | `/blog/seasonal-color-trends-2025/` |
| `/blog/seasonal-color-trends-2025.html` | `/blog/seasonal-color-trends-2025/` |
| `/blog/the-ultimate-guide-to-finding-your-signature-style.html` | `/blog/finding-your-signature-style/` |
| `/privacy-policy.html` | `/privacy-policy/` |
| `/terms-of-service.html` | `/terms-of-service/` |
| `/more-information.html` | `/services/` |
| `/intake-form.html` | `/contact/intake/` |
| `/login.html`, `/member-portal.html`, `/admin.html`, `/auth-tos.html`, `/clothing-matcher/` | `/contact/` for static v1 |

## Static Replacement Decisions

- Booking: replace `/api/available-slots` and `/api/appointments` with the existing Google Appointment Schedule URL from `more-information.html`: `https://calendar.google.com/calendar/appointments/schedules/AcZssZ3wUMcfi9PCbrbgE118d-hvfmKZwgdv39eg488EKFZ8jbFP-yJMlaNEaRHs2Lxe_6Fjz7E-WNSK`.
- Contact and intake: replace DB-backed submissions with direct `mailto:adria@adriacrossedit.com` conversion links for launch.
- Newsletter: remove `/api/newsletter` and replace with a direct email CTA.
- Payments: remove custom Square server APIs and Square browser SDK usage for launch. Use consultation booking as the primary conversion action; future Square hosted links can be added as ordinary outbound URLs.
- Blog/admin: remove browser admin editing. Blog content is edited through Git as JSON files under `src/app/blog/content/*.json`.
- Clothing matcher/member portal: remove from the public static launch. If this remains a product goal, split it into a separate application later.

## Target File Structure

Create:

```text
next.config.ts
postcss.config.mjs
tsconfig.json
vercel.json
src/app/layout.tsx
src/app/page.tsx
src/app/about/page.tsx
src/app/services/page.tsx
src/app/contact/page.tsx
src/app/contact/intake/page.tsx
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
src/app/privacy-policy/page.tsx
src/app/terms-of-service/page.tsx
src/app/not-found.tsx
src/app/robots.ts
src/app/sitemap.ts
src/app/globals.css
src/components/BlogCard.tsx
src/components/JsonLd.tsx
src/components/Markdown.tsx
src/components/SiteFooter.tsx
src/components/SiteHeader.tsx
src/components/ServiceCard.tsx
src/lib/blog.ts
src/lib/faqs.ts
src/lib/navigation.ts
src/lib/seo.ts
src/lib/services.ts
src/lib/site.ts
src/app/blog/content/*.json
scripts/generate-search-index.mjs
scripts/validate-blog-content.mjs
scripts/verify-static-seo.mjs
```

Move or keep as static assets:

```text
public/images/*
public/uploads/blog/*
public/search.json
public/favicon.ico or public/images/icon-*.png
```

Remove after the static site passes verification:

```text
server.js
logger.js
routes/
middleware/
config/passport.js
migrations/
views/
admin.html
auth-tos.html
login.html
member-portal.html
sessions.db
adria_cross.db
scripts/migrate.js
scripts/test-email.js
README_APPOINTMENTS.md
Dockerfile
docker-entrypoint.sh
nginx.conf.template
Procfile
render.yaml
js/auth.js
js/payments.js
clothing-matcher/
tests/api.test.js
test_blog_edit_flow.js
test_edit_date_preservation.js
test_blog_edit.sh
```

---

## Task 1: Create The Migration Branch And Baseline Audit

**Files:**
- Read: `package.json`, `server.js`, `*.html`, `blog/**/*.html`, `js/*.js`, `clothing-matcher/**/*`
- Create: `docs/migration/baseline-api-inventory.txt`
- Create: `docs/migration/baseline-audit.md`

- [ ] **Step 1: Create a dedicated branch**

```bash
git checkout -b codex/nextjs-static-vercel-seo-migration
```

Expected: branch switches to `codex/nextjs-static-vercel-seo-migration`.

- [ ] **Step 2: Record current route/API inventory**

```bash
mkdir -p docs/migration
rg -n "^app\\.(get|post|put|delete|patch)|router\\.(get|post|put|delete|patch)|fetch\\('/api|fetch\\(\"/api|action=\" -S server.js routes *.html blog/**/*.html js/*.js clothing-matcher/**/*.js > docs/migration/baseline-api-inventory.txt
```

Expected: `docs/migration/baseline-api-inventory.txt` includes every current API dependency that must be removed or replaced.

- [ ] **Step 3: Create the baseline audit**

Write `docs/migration/baseline-audit.md` with this content:

```markdown
# Static Migration Baseline Audit

## Dynamic Surfaces To Remove

- Express server entrypoint: server.js
- Database migrations: migrations/*.sql
- Runtime databases: adria_cross.db and sessions.db
- Session/auth routes: routes/auth.js, middleware/auth.js, config/passport.js
- Admin CMS: admin.html and /api/blog routes
- Appointment APIs: /api/available-slots, /api/appointments, /api/availability*
- Intake API: /api/intake
- Newsletter API: /api/newsletter
- Clothing APIs: /api/clothing/* and /api/matches
- Square server APIs: /api/square/config, /api/payments/*, /api/invoices/*

## Static Replacements

- Booking: Google Appointment Schedule embed.
- Contact: mailto link.
- Intake: /contact/intake/ static page with mailto conversion.
- Blog: Next.js App Router pages backed by src/app/blog/content/*.json.
- Payments: consultation booking CTA only for launch; no custom Square JavaScript or server route.
- Admin/member/clothing matcher: removed from public static v1.

## SEO Migration Rules

- New canonical route format uses trailing slashes.
- Old .html URLs redirect permanently to extensionless URLs.
- Duplicate blog paths collapse into one canonical /blog/[slug]/ route.
- Sitemap is generated by Next.js app/sitemap.ts.
- Robots is generated by Next.js app/robots.ts.
- Search index is generated at build time into public/search.json.
- No production source may contain src/app/api.
- No public page may contain fetch('/api') or fetch("/api").
```

- [ ] **Step 4: Commit audit**

```bash
git add docs/migration/baseline-api-inventory.txt docs/migration/baseline-audit.md
git commit -m "docs: audit dynamic surfaces for static migration"
```

Expected: commit succeeds.

---

## Task 2: Replace The Node App Skeleton With Next.js App Router

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tsconfig.json`
- Create: `vercel.json`

- [ ] **Step 1: Install Next.js static-site dependencies**

```bash
npm uninstall bcryptjs better-sqlite3 body-parser connect-sqlite3 cookie-parser cors dotenv express express-rate-limit express-session multer nodemailer passport passport-google-oauth20 pg sqlite sqlite3 square swagger-jsdoc swagger-ui-express helmet joi supertest winston
npm install next@latest react@latest react-dom@latest react-markdown remark-gfm
npm install -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next vitest tailwindcss @tailwindcss/postcss cheerio serve
```

Expected: `package.json` no longer contains database, Express, session, auth, Square SDK, Swagger, or server test dependencies.

- [ ] **Step 2: Replace package scripts**

Modify `package.json` scripts to:

```json
{
  "scripts": {
    "dev": "next dev",
    "prebuild": "node scripts/validate-blog-content.mjs && node scripts/generate-search-index.mjs",
    "build": "npm run typecheck && next build && node scripts/verify-static-seo.mjs",
    "preview": "serve out",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "seo:audit": "node scripts/verify-static-seo.mjs"
  }
}
```

- [ ] **Step 3: Add Next.js static export config**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

Expected: Next emits a static `out/` directory and rejects server-only patterns.

- [ ] **Step 4: Add Tailwind 4 PostCSS config**

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 5: Add strict TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

- [ ] **Step 6: Add Vercel static redirects and headers**

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "redirects": [
    { "source": "/index.html", "destination": "/", "permanent": true },
    { "source": "/about.html", "destination": "/about/", "permanent": true },
    { "source": "/services.html", "destination": "/services/", "permanent": true },
    { "source": "/contact.html", "destination": "/contact/", "permanent": true },
    { "source": "/blog.html", "destination": "/blog/", "permanent": true },
    { "source": "/blog/index.html", "destination": "/blog/", "permanent": true },
    { "source": "/blog/posts/how-to-build-a-capsule-wardrobe.html", "destination": "/blog/how-to-build-a-capsule-wardrobe/", "permanent": true },
    { "source": "/blog/how-to-build-a-capsule-wardrobe.html", "destination": "/blog/how-to-build-a-capsule-wardrobe/", "permanent": true },
    { "source": "/blog/posts/mixing-patterns-like-a-pro.html", "destination": "/blog/mixing-patterns-like-a-pro/", "permanent": true },
    { "source": "/blog/mixing-patterns-like-a-pro.html", "destination": "/blog/mixing-patterns-like-a-pro/", "permanent": true },
    { "source": "/blog/posts/seasonal-color-trends-2025.html", "destination": "/blog/seasonal-color-trends-2025/", "permanent": true },
    { "source": "/blog/seasonal-color-trends-2025.html", "destination": "/blog/seasonal-color-trends-2025/", "permanent": true },
    { "source": "/blog/the-ultimate-guide-to-finding-your-signature-style.html", "destination": "/blog/finding-your-signature-style/", "permanent": true },
    { "source": "/privacy-policy.html", "destination": "/privacy-policy/", "permanent": true },
    { "source": "/terms-of-service.html", "destination": "/terms-of-service/", "permanent": true },
    { "source": "/more-information.html", "destination": "/services/", "permanent": true },
    { "source": "/intake-form.html", "destination": "/contact/intake/", "permanent": true },
    { "source": "/login.html", "destination": "/contact/", "permanent": true },
    { "source": "/member-portal.html", "destination": "/contact/", "permanent": true },
    { "source": "/admin.html", "destination": "/contact/", "permanent": true },
    { "source": "/auth-tos.html", "destination": "/contact/", "permanent": true },
    { "source": "/clothing-matcher/:path*", "destination": "/contact/", "permanent": true }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/uploads/blog/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

- [ ] **Step 7: Commit skeleton**

```bash
git add package.json package-lock.json next.config.ts postcss.config.mjs tsconfig.json vercel.json
git commit -m "chore: scaffold Next.js static App Router site"
```

Expected: commit succeeds.

---

## Task 3: Create Typed Site Data And Shared SEO Helpers

**Files:**
- Create: `src/lib/site.ts`
- Create: `src/lib/navigation.ts`
- Create: `src/lib/services.ts`
- Create: `src/lib/faqs.ts`
- Create: `src/lib/seo.ts`
- Create: `src/components/JsonLd.tsx`

- [ ] **Step 1: Add site constants**

Create `src/lib/site.ts`:

```ts
export const SITE_URL = "https://www.adriacrossedit.com";

export const site = {
  name: "Adria Cross Edit",
  owner: "Adria Cross",
  url: SITE_URL,
  email: "adria@adriacrossedit.com",
  description:
    "Personal styling, closet edits, wardrobe planning, and confidence-focused style guidance from Adria Cross.",
  gaMeasurementId: "G-KY9029WBWZ",
  instagramUrl: "https://www.instagram.com/adriacrossedit/",
  bookingUrl:
    "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3wUMcfi9PCbrbgE118d-hvfmKZwgdv39eg488EKFZ8jbFP-yJMlaNEaRHs2Lxe_6Fjz7E-WNSK",
  defaultOgImage: "/images/adria-hero-new.jpg",
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
```

- [ ] **Step 2: Add navigation data**

Create `src/lib/navigation.ts`:

```ts
export const navigation = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/services/", label: "Services" },
  { href: "/blog/", label: "Blog" },
  { href: "/contact/", label: "Contact" },
] as const;
```

- [ ] **Step 3: Add service data**

Create `src/lib/services.ts`:

```ts
export const services = [
  {
    id: "closet-edit",
    name: "Closet Edit",
    summary:
      "A focused wardrobe review that identifies what to keep, tailor, donate, replace, and style in new ways.",
    price: "From $200",
    image: "/images/adria-services-new.jpg",
    href: "/services/#closet-edit",
  },
  {
    id: "personal-shopping",
    name: "Personal Shopping",
    summary:
      "Targeted shopping support for pieces that fit your body, lifestyle, color preferences, and style goals.",
    price: "Custom quote",
    image: "/images/adria-extra-new.jpg",
    href: "/services/#personal-shopping",
  },
  {
    id: "wardrobe-styling",
    name: "Wardrobe Styling",
    summary:
      "Outfit creation and style direction for events, work, travel, seasonal refreshes, and everyday confidence.",
    price: "Custom quote",
    image: "/images/adria-profile-new.jpg",
    href: "/services/#wardrobe-styling",
  },
] as const;
```

- [ ] **Step 4: Add FAQ data**

Create `src/lib/faqs.ts`:

```ts
export const faqs = [
  {
    question: "How do I book a consultation?",
    answer:
      "Use the booking calendar on the contact page to choose an available time for a consultation.",
  },
  {
    question: "Do I need to buy a new wardrobe?",
    answer:
      "No. A closet edit starts with what you already own and identifies practical gaps only when they matter.",
  },
  {
    question: "Can styling sessions happen virtually?",
    answer:
      "Yes. Adria Cross Edit can support virtual styling when an in-person session is not the right fit.",
  },
] as const;
```

- [ ] **Step 5: Add metadata helper**

Create `src/lib/seo.ts`:

```ts
import type { Metadata } from "next";
import { absoluteUrl, site } from "@/lib/site";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

export function createMetadata({
  title,
  description,
  path,
  image = site.defaultOgImage,
  type = "website",
  noindex = false,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const fullTitle = title.includes(site.owner) ? title : `${title} | ${site.owner}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: !noindex,
      follow: true,
      googleBot: {
        index: !noindex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type,
      url: canonical,
      title: fullTitle,
      description,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}
```

- [ ] **Step 6: Add JSON-LD component**

Create `src/components/JsonLd.tsx`:

```tsx
type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
```

- [ ] **Step 7: Commit shared data**

```bash
git add src/lib src/components/JsonLd.tsx
git commit -m "feat: add typed site metadata and SEO helpers"
```

Expected: commit succeeds.

---

## Task 4: Move Assets Into The Next Public Surface

**Files:**
- Move: `images/*` to `public/images/*`
- Move: retained `uploads/blog/*` to `public/uploads/blog/*`

- [ ] **Step 1: Create public asset folders**

```bash
mkdir -p public/images public/uploads/blog
```

- [ ] **Step 2: Move current image assets**

```bash
git mv images/* public/images/
git mv uploads/blog/* public/uploads/blog/
```

Expected: image files are tracked under `public/`.

- [ ] **Step 3: Remove empty old folders**

```bash
rmdir images uploads/blog uploads 2>/dev/null || true
```

Expected: empty folders are removed.

- [ ] **Step 4: Commit assets**

```bash
git add public
git commit -m "chore: move assets into Next public directory"
```

Expected: commit succeeds.

---

## Task 5: Add Blog JSON Content And Build-Time Blog Loader

**Files:**
- Create: `src/app/blog/content/how-to-build-a-capsule-wardrobe.json`
- Create: `src/app/blog/content/mixing-patterns-like-a-pro.json`
- Create: `src/app/blog/content/seasonal-color-trends-2025.json`
- Create: `src/app/blog/content/finding-your-signature-style.json`
- Create: `src/lib/blog.ts`
- Create: `scripts/validate-blog-content.mjs`
- Create: `src/lib/blog.test.ts`

- [ ] **Step 1: Create JSON blog content shape**

Each migrated post must use this exact shape. Create `src/app/blog/content/how-to-build-a-capsule-wardrobe.json`:

```json
{
  "slug": "how-to-build-a-capsule-wardrobe",
  "title": "How to Build a Capsule Wardrobe",
  "description": "Learn how to build a practical capsule wardrobe with pieces that fit your lifestyle, reduce closet overwhelm, and make everyday outfits easier.",
  "publishedAt": "2025-01-01",
  "updatedAt": "2025-01-01",
  "author": "Adria Cross",
  "image": "/images/capsule-wardrobe.jpg",
  "imageAlt": "Capsule wardrobe clothing arranged for personal styling",
  "tags": ["capsule wardrobe", "personal style", "closet edit"],
  "body": "A capsule wardrobe is not about owning the fewest pieces possible. It is about building a smaller set of useful clothes that work together, fit your real life, and make getting dressed easier.\\n\\n## Start With The Week You Actually Live\\n\\nLook at the places you actually go, the weather you actually dress for, and the clothes you already reach for. A practical capsule starts with repeated reality, not a fantasy version of your calendar.\\n\\n## Choose A Clear Color Foundation\\n\\nPick a small group of base colors, then add accent colors that make your outfits feel personal. This keeps new purchases from becoming isolated pieces.\\n\\n## Keep What Earns Its Space\\n\\nThe strongest capsule wardrobes are edited, not stripped bare. Keep pieces that fit, feel good, and support more than one outfit.\\n\\n## Fill Gaps Slowly\\n\\nAfter the edit, list the missing pieces that would unlock more outfits. Buy those intentionally instead of rebuilding everything at once."
}
```

Create the other JSON files with these metadata values and migrated body content from the matching current HTML files:

```json
{
  "slug": "mixing-patterns-like-a-pro",
  "title": "Mixing Patterns Like a Pro",
  "description": "Learn practical pattern mixing rules for building polished outfits with prints, color balance, scale, and personal styling confidence.",
  "publishedAt": "2025-01-02",
  "updatedAt": "2025-01-02",
  "author": "Adria Cross",
  "image": "/images/mixing-patterns.jpg",
  "imageAlt": "Patterned wardrobe pieces styled together",
  "tags": ["pattern mixing", "personal style", "outfit ideas"],
  "body": "Pattern mixing works best when the outfit still has structure. Start with one dominant print, add a smaller supporting print, and use color repetition to make the combination feel intentional.\\n\\n## Vary The Scale\\n\\nPair a larger pattern with a smaller one so the two prints are not competing at the same volume.\\n\\n## Repeat A Color\\n\\nA shared color is the easiest way to make two different prints look related.\\n\\n## Use Solids As Breathing Room\\n\\nShoes, belts, denim, jackets, or simple layers can calm a busy outfit while keeping the pattern mix interesting."
}
```

```json
{
  "slug": "seasonal-color-trends-2025",
  "title": "Seasonal Color Trends for 2025",
  "description": "Explore wearable seasonal color trends for 2025 and learn how to add fresh color to your wardrobe without losing your personal style.",
  "publishedAt": "2025-01-03",
  "updatedAt": "2025-01-03",
  "author": "Adria Cross",
  "image": "/images/color-trends-2025.jpg",
  "imageAlt": "Seasonal color palette for wardrobe styling",
  "tags": ["color trends", "wardrobe color", "2025 fashion"],
  "body": "Color trends are useful when they help you refresh what already works. They become expensive distractions when they pull your wardrobe away from your lifestyle, coloring, and favorite outfit formulas.\\n\\n## Start With Accessories\\n\\nScarves, jewelry, handbags, shoes, and lightweight layers let you test a trend without rebuilding your closet.\\n\\n## Pair Trend Colors With Neutrals\\n\\nA fresh color usually becomes more wearable when it is anchored by denim, black, navy, camel, cream, or another trusted neutral.\\n\\n## Keep Your Best Colors In Charge\\n\\nThe trend should support your style, not replace it. Choose the version of the color that flatters you and works with what you already own."
}
```

```json
{
  "slug": "finding-your-signature-style",
  "title": "The Ultimate Guide to Finding Your Signature Style",
  "description": "Find your signature style by identifying repeat outfits, defining style words, matching your lifestyle, and building a practical inspiration board.",
  "publishedAt": "2025-12-24",
  "updatedAt": "2025-12-24",
  "author": "Adria Cross",
  "image": "/uploads/blog/blog-1766627887957-548611827.png",
  "imageAlt": "Personal styling inspiration for finding a signature style",
  "tags": ["signature style", "closet edit", "wardrobe confidence"],
  "body": "Finding your signature style is not about following every trend. It is about recognizing what already makes you feel most like yourself and building a wardrobe around that evidence.\\n\\n## Analyze Your Repeat Favorites\\n\\nPull out the pieces you reach for constantly. Look for patterns in fit, color, fabric, structure, and mood.\\n\\n## Define Three Style Words\\n\\nChoose three words that describe how you want your clothes to feel. Use them as a filter before buying anything new.\\n\\n## Prioritize Your Lifestyle\\n\\nA signature style has to work for the life you actually live. The best wardrobe is both expressive and usable.\\n\\n## Build A Mood Board\\n\\nSave outfits that catch your eye and review them for repeated themes. Those patterns are clues, not rules."
}
```

- [ ] **Step 2: Add build-time blog loader**

Create `src/lib/blog.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  image: string;
  imageAlt: string;
  tags: string[];
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "src/app/blog/content");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid blog field: ${field}`);
  }
  return value;
}

function requireTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((tag) => typeof tag !== "string")) {
    throw new Error("Invalid blog field: tags");
  }
  return value;
}

export function parseBlogPost(raw: unknown): BlogPost {
  if (!isRecord(raw)) throw new Error("Blog post must be an object");

  return {
    slug: requireString(raw.slug, "slug"),
    title: requireString(raw.title, "title"),
    description: requireString(raw.description, "description"),
    publishedAt: requireString(raw.publishedAt, "publishedAt"),
    updatedAt: requireString(raw.updatedAt, "updatedAt"),
    author: requireString(raw.author, "author"),
    image: requireString(raw.image, "image"),
    imageAlt: requireString(raw.imageAlt, "imageAlt"),
    tags: requireTags(raw.tags),
    body: requireString(raw.body, "body"),
  };
}

export function getAllPosts(): BlogPost[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(CONTENT_DIR, file);
      const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      return parseBlogPost(parsed);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}
```

- [ ] **Step 3: Add blog loader tests**

Create `src/lib/blog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getAllPosts, parseBlogPost } from "./blog";

describe("blog content", () => {
  it("loads posts with unique slugs", () => {
    const posts = getAllPosts();
    const slugs = posts.map((post) => post.slug);

    expect(posts.length).toBeGreaterThanOrEqual(4);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("requires complete metadata", () => {
    expect(() => parseBlogPost({ slug: "missing-fields" })).toThrow(
      "Invalid blog field: title",
    );
  });

  it("uses canonical slug format and SEO-length descriptions", () => {
    for (const post of getAllPosts()) {
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
      expect(post.description.length).toBeGreaterThanOrEqual(70);
      expect(post.description.length).toBeLessThanOrEqual(170);
      expect(post.image).toMatch(/^\\/(images|uploads\\/blog)\\//);
    }
  });
});
```

- [ ] **Step 4: Add content validation script**

Create `scripts/validate-blog-content.mjs`:

```js
import fs from "node:fs";
import path from "node:path";

const contentDir = path.resolve("src/app/blog/content");
const errors = [];
const slugs = new Set();

for (const file of fs.readdirSync(contentDir).filter((entry) => entry.endsWith(".json"))) {
  const fullPath = path.join(contentDir, file);
  const post = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  for (const field of ["slug", "title", "description", "publishedAt", "updatedAt", "author", "image", "imageAlt", "body"]) {
    if (typeof post[field] !== "string" || post[field].trim() === "") {
      errors.push(`${file}: missing string field ${field}`);
    }
  }

  if (!Array.isArray(post.tags) || post.tags.length === 0) {
    errors.push(`${file}: tags must be a non-empty array`);
  }

  if (typeof post.slug === "string") {
    if (!/^[a-z0-9-]+$/.test(post.slug)) errors.push(`${file}: invalid slug`);
    if (slugs.has(post.slug)) errors.push(`${file}: duplicate slug ${post.slug}`);
    slugs.add(post.slug);
  }

  if (typeof post.description === "string" && (post.description.length < 70 || post.description.length > 170)) {
    errors.push(`${file}: description must be 70-170 characters`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${slugs.size} blog posts.`);
```

- [ ] **Step 5: Verify blog content**

```bash
npm test -- src/lib/blog.test.ts
node scripts/validate-blog-content.mjs
```

Expected: both commands pass.

- [ ] **Step 6: Commit blog content model**

```bash
git add src/app/blog/content src/lib/blog.ts src/lib/blog.test.ts scripts/validate-blog-content.mjs
git commit -m "feat: add static JSON blog content"
```

Expected: commit succeeds.

---

## Task 6: Build Layout, Navigation, Markdown, And Shared Components

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/SiteHeader.tsx`
- Create: `src/components/SiteFooter.tsx`
- Create: `src/components/Markdown.tsx`
- Create: `src/components/ServiceCard.tsx`
- Create: `src/components/BlogCard.tsx`

- [ ] **Step 1: Add root layout**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { absoluteUrl, site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.owner} | Personal Stylist`,
    template: `%s | ${site.owner}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    images: [{ url: absoluteUrl(site.defaultOgImage) }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Link className="skip-link" href="#main-content">
          Skip to content
        </Link>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${site.gaMeasurementId}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${site.gaMeasurementId}');
            `,
          }}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add header**

Create `src/components/SiteHeader.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { navigation } from "@/lib/navigation";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label={`${site.name} home`}>
          <Image src="/images/logo.png" alt="" width={160} height={80} priority />
          <span>{site.name}</span>
        </Link>
        <ul className="nav-menu">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Add footer**

Create `src/components/SiteFooter.tsx`:

```tsx
import Link from "next/link";
import { navigation } from "@/lib/navigation";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="footer-brand">{site.name}</p>
        <p>{site.description}</p>
      </div>
      <nav aria-label="Footer navigation">
        {navigation.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/privacy-policy/">Privacy</Link>
        <Link href="/terms-of-service/">Terms</Link>
      </nav>
      <p>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
    </footer>
  );
}
```

- [ ] **Step 4: Add Markdown renderer**

Create `src/components/Markdown.tsx`:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  children: string;
};

export function Markdown({ children }: MarkdownProps) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>;
}
```

- [ ] **Step 5: Add cards**

Create `src/components/ServiceCard.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import type { services } from "@/lib/services";

type Service = (typeof services)[number];

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article id={service.id} className="service-card">
      <Image src={service.image} alt="" width={720} height={480} />
      <h2>{service.name}</h2>
      <p>{service.summary}</p>
      <p className="price">{service.price}</p>
      <Link href={service.href}>View service</Link>
    </article>
  );
}
```

Create `src/components/BlogCard.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="blog-card">
      <Link href={`/blog/${post.slug}/`}>
        <Image src={post.image} alt={post.imageAlt} width={720} height={480} />
        <h2>{post.title}</h2>
        <p>{post.description}</p>
      </Link>
    </article>
  );
}
```

- [ ] **Step 6: Add global styles**

Create `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --color-ink: #25211d;
  --color-muted: #6f645b;
  --color-paper: #fffdf8;
  --color-surface: #f7f0e7;
  --color-accent: #9f6f43;
  --color-accent-strong: #6f4829;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--color-ink);
  background: var(--color-paper);
  font-family: Montserrat, Arial, sans-serif;
}

img {
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
}

.skip-link {
  position: absolute;
  left: 1rem;
  top: -4rem;
  z-index: 100;
  background: var(--color-ink);
  color: white;
  padding: 0.75rem 1rem;
}

.skip-link:focus {
  top: 1rem;
}

.site-header,
.site-footer {
  width: 100%;
  padding: 1rem clamp(1rem, 4vw, 4rem);
}

.site-nav,
.site-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.brand,
.nav-menu,
.site-footer nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

.page-hero,
.section {
  padding: clamp(3rem, 8vw, 7rem) clamp(1rem, 4vw, 4rem);
}

.button {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.8rem 1.1rem;
  border-radius: 6px;
  background: var(--color-accent-strong);
  color: white;
  text-decoration: none;
  font-weight: 700;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.service-card,
.blog-card {
  border: 1px solid color-mix(in srgb, var(--color-muted), transparent 70%);
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.service-card > :not(img),
.blog-card > a > :not(img) {
  margin-left: 1rem;
  margin-right: 1rem;
}

@media (max-width: 720px) {
  .site-nav,
  .site-footer,
  .nav-menu {
    align-items: flex-start;
    flex-direction: column;
  }
}
```

- [ ] **Step 7: Commit shared shell**

```bash
git add src/app/layout.tsx src/app/globals.css src/components
git commit -m "feat: add App Router layout and shared components"
```

Expected: commit succeeds.

---

## Task 7: Rebuild Core Public Pages In App Router

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/about/page.tsx`
- Create: `src/app/services/page.tsx`
- Create: `src/app/contact/page.tsx`
- Create: `src/app/contact/intake/page.tsx`
- Create: `src/app/privacy-policy/page.tsx`
- Create: `src/app/terms-of-service/page.tsx`
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Rebuild homepage**

Create `src/app/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ServiceCard } from "@/components/ServiceCard";
import { createMetadata } from "@/lib/seo";
import { services } from "@/lib/services";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Personal Stylist for Closet Edits and Wardrobe Confidence",
  description:
    "Transform your wardrobe with Adria Cross Edit, a personal styling service for closet edits, wardrobe planning, outfit creation, and confidence-focused style guidance.",
  path: "/",
  image: "/images/adria-hero-new.jpg",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.name,
  founder: site.owner,
  url: site.url,
  image: absoluteUrl("/images/adria-hero-new.jpg"),
  email: site.email,
  priceRange: "$200-$1,200",
  sameAs: [site.instagramUrl],
  serviceType: services.map((service) => service.name),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="page-hero">
        <div>
          <h1>Personal styling that makes your wardrobe easier to wear.</h1>
          <p>
            Adria Cross Edit helps clients refine what they own, identify what is missing,
            and build outfits that feel polished, practical, and personal.
          </p>
          <Link className="button" href="/contact/">
            Book a consultation
          </Link>
        </div>
        <Image src="/images/adria-hero-new.jpg" alt="Adria Cross personal styling portrait" width={1200} height={800} priority />
      </section>
      <section className="section">
        <h2>Styling services</h2>
        <div className="grid">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Rebuild about page**

Create `src/app/about/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Adria Cross",
  description:
    "Learn about Adria Cross Edit, a personal styling service focused on closet edits, wardrobe clarity, outfit confidence, and practical personal style.",
  path: "/about/",
  image: "/images/adria-about-new.jpg",
});

export default function AboutPage() {
  return (
    <section className="page-hero">
      <div>
        <h1>About Adria Cross</h1>
        <p>
          Adria Cross Edit is built around a simple idea: great style should make
          everyday dressing clearer, calmer, and more confident.
        </p>
        <p>
          The work starts with what you already own, then turns scattered pieces
          into a wardrobe that fits your body, schedule, preferences, and goals.
        </p>
        <Link className="button" href="/contact/">
          Work with Adria
        </Link>
      </div>
      <Image src="/images/adria-about-new.jpg" alt="Adria Cross" width={1000} height={700} />
    </section>
  );
}
```

- [ ] **Step 3: Rebuild services page**

Create `src/app/services/page.tsx`:

```tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ServiceCard } from "@/components/ServiceCard";
import { createMetadata } from "@/lib/seo";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Personal Styling Services",
  description:
    "Explore personal styling services from Adria Cross Edit, including closet edits, wardrobe styling, personal shopping, and practical style planning.",
  path: "/services/",
  image: "/images/adria-services-new.jpg",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  provider: {
    "@type": "ProfessionalService",
    name: site.name,
    url: site.url,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Personal Styling Services",
    itemListElement: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.summary,
      },
    })),
  },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="page-hero">
        <h1>Personal Styling Services</h1>
        <p>Closet clarity, outfit planning, and practical style support.</p>
      </section>
      <section className="section">
        <div className="grid">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Rebuild contact page**

Create `src/app/contact/page.tsx`:

```tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { faqs } from "@/lib/faqs";
import { createMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Contact Adria Cross",
  description:
    "Book a consultation with Adria Cross Edit for closet edits, wardrobe styling, personal shopping, and confidence-focused style guidance.",
  path: "/contact/",
  image: "/images/adria-contact-new.jpg",
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <section className="page-hero">
        <h1>Book a Personal Styling Consultation</h1>
        <p>Choose a time on the calendar or email Adria directly.</p>
        <a className="button" href={`mailto:${site.email}`}>
          Email Adria
        </a>
      </section>
      <section id="calendar-section" className="section" aria-labelledby="booking-heading">
        <h2 id="booking-heading">Choose a Consultation Time</h2>
        <iframe
          src={site.bookingUrl}
          title="Book a consultation with Adria Cross"
          loading="lazy"
          width="100%"
          height="720"
        />
      </section>
    </>
  );
}
```

- [ ] **Step 5: Rebuild intake page as static-safe**

Create `src/app/contact/intake/page.tsx`:

```tsx
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Style Intake",
  description:
    "Prepare for a personal styling consultation with Adria Cross Edit by reviewing wardrobe goals, fit preferences, lifestyle needs, and style questions.",
  path: "/contact/intake/",
  image: "/images/intake-form.jpg",
  noindex: true,
});

export default function IntakePage() {
  const subject = encodeURIComponent("Style Intake");
  const body = encodeURIComponent(
    "Name:\\n\\nWardrobe goals:\\n\\nStyle challenges:\\n\\nFavorite pieces:\\n\\nSizing or fit notes:\\n\\nUpcoming events or needs:\\n",
  );

  return (
    <section className="page-hero">
      <h1>Style Intake</h1>
      <p>
        Use these prompts to prepare for your consultation, then email your notes
        directly to Adria.
      </p>
      <a className="button" href={`mailto:${site.email}?subject=${subject}&body=${body}`}>
        Email intake notes
      </a>
    </section>
  );
}
```

- [ ] **Step 6: Rebuild legal and not-found pages**

Create `src/app/privacy-policy/page.tsx`, `src/app/terms-of-service/page.tsx`, and `src/app/not-found.tsx` using the existing legal copy from `privacy-policy.html`, `terms-of-service.html`, and `404.html`. Each file must export one `metadata` object from `createMetadata()`, and `not-found.tsx` must render exactly one `<h1>`.

- [ ] **Step 7: Verify no API calls remain in app pages**

```bash
rg -n "fetch\\(['\\\"]?/api|action=['\\\"]?/api|/api/|src/app/api" src
```

Expected: no matches.

- [ ] **Step 8: Commit public pages**

```bash
git add src/app
git commit -m "feat: rebuild public pages in Next App Router"
```

Expected: commit succeeds.

---

## Task 8: Build Blog Routes, Metadata, Sitemap, Robots, And Search

**Files:**
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`
- Create: `scripts/generate-search-index.mjs`

- [ ] **Step 1: Build blog index**

Create `src/app/blog/page.tsx`:

```tsx
import type { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import { getAllPosts } from "@/lib/blog";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Style Blog",
  description:
    "Personal styling advice, closet edit tips, wardrobe planning ideas, and practical style guidance from Adria Cross.",
  path: "/blog/",
  image: "/images/style-blog.jpg",
});

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="page-hero">
        <h1>Style Blog</h1>
        <p>Wardrobe guidance, closet edit ideas, and practical styling advice.</p>
      </section>
      <section className="section">
        <div className="grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Build blog detail route**

Create `src/app/blog/[slug]/page.tsx`:

```tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { createMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return createMetadata({
      title: "Style Article",
      description: "Personal styling article from Adria Cross Edit.",
      path: "/blog/",
      noindex: true,
    });
  }

  return createMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}/`,
    image: post.image,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Person",
      name: post.author,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: absoluteUrl(post.image),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}/`),
  };

  return (
    <article className="section">
      <JsonLd data={jsonLd} />
      <header>
        <h1>{post.title}</h1>
        <p>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        <Image src={post.image} alt={post.imageAlt} width={1200} height={800} priority />
      </header>
      <Markdown>{post.body}</Markdown>
    </article>
  );
}
```

- [ ] **Step 3: Add robots metadata route**

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
```

- [ ] **Step 4: Add sitemap metadata route**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { site } from "@/lib/site";

const staticRoutes = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/about/", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services/", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/contact/", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/blog/", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/privacy-policy/", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/terms-of-service/", priority: 0.2, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = staticRoutes.map((route) => ({
    url: new URL(route.path, site.url).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const posts = getAllPosts().map((post) => ({
    url: new URL(`/blog/${post.slug}/`, site.url).toString(),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...pages, ...posts];
}
```

- [ ] **Step 5: Add search index generator**

Create `scripts/generate-search-index.mjs`:

```js
import fs from "node:fs";
import path from "node:path";

const contentDir = path.resolve("src/app/blog/content");
const publicDir = path.resolve("public");
const posts = fs
  .readdirSync(contentDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8")))
  .map((post) => ({
    title: post.title,
    url: `/blog/${post.slug}/`,
    category: "Blog",
    summary: post.description,
    keywords: post.tags.join(", "),
  }));

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "search.json"), `${JSON.stringify(posts, null, 2)}\n`);
console.log(`Generated public/search.json with ${posts.length} posts.`);
```

- [ ] **Step 6: Verify static blog output**

```bash
npm run build
find out/blog -maxdepth 2 -type f | sort
test -f out/sitemap.xml
test -f out/robots.txt
test -f public/search.json
```

Expected: `out/blog/index.html` plus one `index.html` under each canonical post slug. No `/blog/posts/` output exists.

- [ ] **Step 7: Commit SEO routes**

```bash
git add src/app/blog src/app/robots.ts src/app/sitemap.ts scripts/generate-search-index.mjs public/search.json
git commit -m "feat: add static blog and SEO metadata routes"
```

Expected: commit succeeds.

---

## Task 9: Add Static SEO Verification

**Files:**
- Create: `scripts/verify-static-seo.mjs`

- [ ] **Step 1: Create SEO verifier**

Create `scripts/verify-static-seo.mjs`:

```js
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const outDir = path.resolve("out");
const allowedNoindex = new Set(["/404.html", "/contact/intake/index.html"]);
const errors = [];

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listHtmlFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
    }),
  );
  return files.flat();
}

function routeFromFile(file) {
  const relative = path.relative(outDir, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  return `/${relative}`;
}

const htmlFiles = await listHtmlFiles(outDir);

for (const file of htmlFiles) {
  const route = routeFromFile(file);
  const html = await readFile(file, "utf8");
  const $ = load(html);
  const title = $("title").text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim();
  const canonical = $('link[rel="canonical"]').attr("href")?.trim();
  const h1Count = $("h1").length;
  const robots = $('meta[name="robots"]').attr("content") ?? "";
  const apiRefs = html.match(/\/api\//g) ?? [];

  if (!title || title.length < 20 || title.length > 75) {
    errors.push(`${route}: title should be 20-75 characters`);
  }

  if (!description || description.length < 70 || description.length > 170) {
    errors.push(`${route}: meta description should be 70-170 characters`);
  }

  if (!canonical || !canonical.startsWith("https://www.adriacrossedit.com/")) {
    errors.push(`${route}: canonical must use production domain`);
  }

  if (h1Count !== 1) {
    errors.push(`${route}: expected exactly one h1, found ${h1Count}`);
  }

  if (apiRefs.length > 0) {
    errors.push(`${route}: contains /api/ references`);
  }

  if (robots.includes("noindex") && !allowedNoindex.has(route)) {
    errors.push(`${route}: noindex is not allowed on this route`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Static SEO verification passed for ${htmlFiles.length} HTML files.`);
```

- [ ] **Step 2: Run static SEO verifier**

```bash
npm run build
```

Expected: build passes and prints `Static SEO verification passed`.

- [ ] **Step 3: Commit verifier**

```bash
git add scripts/verify-static-seo.mjs package.json package-lock.json
git commit -m "test: verify static Next SEO output"
```

Expected: commit succeeds.

---

## Task 10: Remove Server, Database, Auth, Admin, And DB-Backed Features

**Files:**
- Delete: dynamic files listed in the removal section
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Remove dynamic app files**

```bash
git rm server.js logger.js
git rm -r routes middleware migrations views config clothing-matcher
git rm admin.html auth-tos.html login.html member-portal.html intake-form.html
git rm scripts/migrate.js scripts/test-email.js
git rm tests/api.test.js test_blog_edit_flow.js test_edit_date_preservation.js test_blog_edit.sh
git rm Dockerfile docker-entrypoint.sh nginx.conf.template Procfile render.yaml README_APPOINTMENTS.md
git rm adria_cross.db sessions.db
```

Expected: dynamic files are staged for deletion.

- [ ] **Step 2: Remove old static HTML/JS after App Router pages exist**

```bash
git rm index.html about.html services.html contact.html blog.html more-information.html privacy-policy.html terms-of-service.html 404.html
git rm -r blog
git rm js/auth.js js/payments.js js/main.min.js
```

Keep `js/main.js` only if implementation intentionally migrates a small static-safe part of it into React components; otherwise remove it.

- [ ] **Step 3: Update `.gitignore`**

Ensure `.gitignore` contains:

```gitignore
node_modules
.env
.DS_Store
.next
out
.vercel
*.log
*.db
```

- [ ] **Step 4: Rewrite README**

Replace `README.md` with:

```markdown
# Adria Cross Edit

Static, SEO-first website for Adria Cross Edit.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Static export
- Vercel hosting

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Content

- Public pages live in `src/app/`.
- Blog posts live in `src/app/blog/content/*.json`.
- Shared business data lives in `src/lib/`.
- Static assets live in `public/`.

## Deployment

Vercel should use:

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: `out`

The site has no app-owned database, no Express server, and no custom API routes.
```

- [ ] **Step 5: Verify no database/server references remain**

```bash
rg -n "(express|sqlite|postgres|pg|better-sqlite3|DATABASE_URL|SESSION_SECRET|passport|bcrypt|migrations|server.js|src/app/api|/api/)" . -g '!node_modules' -g '!package-lock.json'
```

Expected: matches only appear in migration docs or redirect descriptions. No runtime source files should match.

- [ ] **Step 6: Commit removal**

```bash
git add -A
git commit -m "refactor: remove database-backed application surface"
```

Expected: commit succeeds.

---

## Task 11: Local Quality Pass

**Files:**
- Modify: any page/component/style file that fails verification

- [ ] **Step 1: Run full verification**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands pass.

- [ ] **Step 2: Preview static output locally**

```bash
npm run preview
```

Expected: `serve out` starts a local static server. Keep it running while checking pages.

- [ ] **Step 3: Check core routes in browser**

Open these routes in the local preview:

```text
/
/about/
/services/
/contact/
/contact/intake/
/blog/
/blog/how-to-build-a-capsule-wardrobe/
/privacy-policy/
/terms-of-service/
/sitemap.xml
/robots.txt
/search.json
```

Expected:

- Header and footer render on every page.
- Exactly one H1 appears visually on every HTML page.
- Booking calendar appears on `/contact/`.
- No page attempts to call `/api/*`.
- Blog routes render from JSON content.
- `search.json`, `sitemap.xml`, and `robots.txt` are present in static output.

- [ ] **Step 4: Check old URL redirect rules**

Inspect `vercel.json` and verify these old routes are covered:

```text
/about.html
/services.html
/contact.html
/blog.html
/blog/posts/how-to-build-a-capsule-wardrobe.html
/blog/the-ultimate-guide-to-finding-your-signature-style.html
/intake-form.html
/login.html
/admin.html
/clothing-matcher/
```

Expected: each route has a permanent redirect to a canonical static route.

- [ ] **Step 5: Commit quality fixes**

```bash
git add -A
git commit -m "fix: polish static App Router quality gates"
```

Expected: commit succeeds if fixes were needed. If no files changed, skip this commit.

---

## Task 12: Vercel Deployment Preparation

**Files:**
- Create: `docs/deployment/vercel.md`
- Modify: `README.md`

- [ ] **Step 1: Add deployment notes**

Create `docs/deployment/vercel.md`:

```markdown
# Vercel Deployment

## Project Settings

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: `out`
- Install command: `npm install`

## Environment Variables

No database variables are required.

If Google Analytics changes, update `src/lib/site.ts`.

## Domain

Production domain: `www.adriacrossedit.com`

## Pre-Deploy Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Post-Deploy Checks

- Open `/`.
- Open `/services/`.
- Open `/contact/`.
- Open `/blog/`.
- Open `/sitemap.xml`.
- Open `/robots.txt`.
- Open `/search.json`.
- Confirm old `.html` URLs redirect to canonical routes.
- Confirm there are no live `/api/*` network requests.
```

- [ ] **Step 2: Run final local verification**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands pass.

- [ ] **Step 3: Commit deployment docs**

```bash
git add docs/deployment/vercel.md README.md
git commit -m "docs: add Vercel static deployment guide"
```

Expected: commit succeeds.

---

## Execution Order

1. Task 1: Audit current dynamic surfaces.
2. Task 2: Scaffold Next.js App Router, TypeScript, Tailwind, and Vercel static export.
3. Task 3: Add typed site data and metadata helpers.
4. Task 4: Move assets.
5. Task 5: Add JSON blog content and loader.
6. Task 6: Add layout and shared components.
7. Task 7: Rebuild public pages.
8. Task 8: Add blog routes, sitemap, robots, and search.
9. Task 9: Add static SEO verification.
10. Task 10: Remove database/server code.
11. Task 11: Run quality pass.
12. Task 12: Prepare Vercel deployment.

## Acceptance Criteria

- `npm run lint` succeeds.
- `npm run typecheck` succeeds.
- `npm test` succeeds.
- `npm run build` succeeds and emits `out/`.
- `out/sitemap.xml`, `out/robots.txt`, and `out/search.json` exist.
- `rg -n "(src/app/api|/api/|express|sqlite|postgres|DATABASE_URL|SESSION_SECRET)" src public package.json next.config.ts vercel.json` returns no runtime database/server dependencies.
- Old `.html` URLs are represented in `vercel.json` permanent redirects.
- Core pages use production canonicals under `https://www.adriacrossedit.com`.
- Every indexable page has exactly one H1, a useful title, a 70-170 character meta description, and OG/Twitter image metadata.
- Duplicate blog URL families are collapsed to one canonical route per post.
- There is no committed `.db` or `.log` file.
- The site can be hosted on Vercel without Render, Docker, Express, PostgreSQL, SQLite, sessions, or custom API routes.

## Known Tradeoffs

- `output: "export"` is intentionally strict. It prevents Next server features, route handlers, ISR, Server Actions, and request-time logic.
- Redirects and headers live in `vercel.json` because Next `redirects()` and `headers()` are not available in static export mode.
- Next image optimization is disabled with `images.unoptimized` because static export has no runtime image optimizer.
- Removing auth, admin, member portal, Square server APIs, and clothing matcher is intentional for the static v1.
- A Git-based JSON blog is less friendly for nontechnical editing than the current admin panel, but it is faster, safer, SEO-stable, and database-free.

## Recommended Execution Mode

Plan complete and saved to `docs/superpowers/plans/2026-05-24-static-vercel-seo-migration.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, faster iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.
