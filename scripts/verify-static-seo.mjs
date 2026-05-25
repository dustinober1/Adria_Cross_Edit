import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const outDir = path.resolve("out");
const allowedNoindex = new Set([
  "/404.html",
  "/404/index.html",
  "/_not-found/index.html",
  "/contact/intake/index.html",
]);
const skipCanonicalCheck = new Set([
  "/404.html",
  "/404/index.html",
  "/_not-found/index.html",
]);
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

  if (
    !skipCanonicalCheck.has(route) &&
    (!canonical || !canonical.startsWith("https://www.adriacrossedit.com/"))
  ) {
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
