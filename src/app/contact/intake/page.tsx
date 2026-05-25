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
    "Name:\n\nWardrobe goals:\n\nStyle challenges:\n\nFavorite pieces:\n\nSizing or fit notes:\n\nUpcoming events or needs:\n",
  );

  return (
    <section className="legal-shell">
      <article className="legal-card">
        <p className="eyebrow">Before We Meet</p>
        <h1>Style Intake</h1>
        <p>
          Use these prompts to organize your thoughts before your consultation.
          The goal is not to write something perfect. The goal is to give Adria a
          clearer picture of what is and is not working in your wardrobe.
        </p>
        <ul>
          <li>Your main wardrobe goals right now</li>
          <li>Where getting dressed feels hardest</li>
          <li>Favorite pieces you already own</li>
          <li>Fit, sizing, or comfort concerns</li>
          <li>Upcoming events, travel, or seasonal needs</li>
        </ul>
        <a className="button" href={`mailto:${site.email}?subject=${subject}&body=${body}`}>
          Email intake notes
        </a>
      </article>
    </section>
  );
}
