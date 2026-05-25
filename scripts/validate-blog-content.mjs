import fs from "node:fs";
import path from "node:path";

const contentDir = path.resolve("src/app/blog/content");
const errors = [];
const slugs = new Set();

for (const file of fs.readdirSync(contentDir).filter((entry) => entry.endsWith(".json"))) {
  const fullPath = path.join(contentDir, file);
  const post = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  for (const field of [
    "slug",
    "title",
    "description",
    "publishedAt",
    "updatedAt",
    "author",
    "image",
    "imageAlt",
    "body",
  ]) {
    if (typeof post[field] !== "string" || post[field].trim() === "") {
      errors.push(`${file}: missing string field ${field}`);
    }
  }

  if (!Array.isArray(post.tags) || post.tags.length === 0) {
    errors.push(`${file}: tags must be a non-empty array`);
  }

  if (typeof post.slug === "string") {
    if (!/^[a-z0-9-]+$/.test(post.slug)) {
      errors.push(`${file}: invalid slug`);
    }
    if (slugs.has(post.slug)) {
      errors.push(`${file}: duplicate slug ${post.slug}`);
    }
    slugs.add(post.slug);
  }

  if (
    typeof post.description === "string" &&
    (post.description.length < 70 || post.description.length > 170)
  ) {
    errors.push(`${file}: description must be 70-170 characters`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${slugs.size} blog posts.`);
