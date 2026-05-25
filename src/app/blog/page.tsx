import type { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import { MediaFrame } from "@/components/MediaFrame";
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
        <div>
          <p className="eyebrow">Style Blog</p>
          <h1>Wardrobe advice with a real-life point of view.</h1>
          <p>
            Articles on personal style, color, closet edits, and dressing with
            more confidence and less clutter.
          </p>
        </div>
        <MediaFrame
          alt="A curated wardrobe with folded pieces and hanging garments."
          priority
          src="/images/style-blog.jpg"
          variant="panel"
        />
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Featured Guidance</p>
          <h2>Start with the wardrobe question you are already asking.</h2>
        </div>
        <div className="grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
