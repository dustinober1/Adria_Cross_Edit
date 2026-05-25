import Link from "next/link";
import { MediaFrame } from "@/components/MediaFrame";
import type { BlogPost } from "@/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="blog-card">
      <MediaFrame alt={post.imageAlt} src={post.image} variant="card" />
      <div className="card-copy">
        <p className="eyebrow">
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <h2>{post.title}</h2>
        <p>{post.description}</p>
        <Link className="text-link" href={`/blog/${post.slug}/`}>
          Read article
        </Link>
      </div>
    </article>
  );
}
