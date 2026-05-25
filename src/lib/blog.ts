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
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((tag) => typeof tag !== "string" || tag.trim().length === 0)
  ) {
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
