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
