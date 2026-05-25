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
        <p className="search-note">Search is generated at build time for static browsing and indexing.</p>
        <div className="grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
