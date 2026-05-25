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
      expect(post.image).toMatch(/^\/(images|uploads\/blog)\//);
    }
  });
});
