# Adria Cross Edit

Static, SEO-first marketing site for Adria Cross Edit, built with Next.js App Router, TypeScript, and static export for Vercel hosting.

## Stack

- Next.js App Router
- TypeScript
- React 19
- Tailwind CSS 4 via `src/app/globals.css`
- Static export with `output: "export"`
- JSON-driven blog content under `src/app/blog/content`

## Local development

```bash
npm install
npm run dev
```

The local dev server runs on [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run seo:audit
npm run preview
```

`npm run build` validates blog content, generates the blog search index, builds the static export into `out/`, and runs a post-build SEO verification pass.

## Content model

- Site pages live in `src/app`
- Shared UI components live in `src/components`
- Shared content and SEO helpers live in `src/lib`
- Blog posts live in `src/app/blog/content/*.json`
- Static assets live in `public/images` and `public/uploads/blog`

## Deployment

Deploy on Vercel as a Next.js project. The repository is configured for static export:

- build command: `npm run build`
- output directory: `out`
- redirects and cache headers are defined in `vercel.json`

## SEO surfaces

- Page metadata and canonical tags come from `src/lib/seo.ts`
- `src/app/sitemap.ts` generates the sitemap
- `src/app/robots.ts` generates robots rules
- `src/app/manifest.ts` generates the web manifest
- `scripts/verify-static-seo.mjs` validates exported HTML metadata

## Notes

The prior Express, database, auth, and payment runtime has been removed. This repository is now a static marketing and content site only.
