import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MediaFrame } from "@/components/MediaFrame";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Adria Cross",
  description:
    "Learn about Adria Cross Edit, a personal styling service focused on closet edits, wardrobe clarity, outfit confidence, and practical personal style.",
  path: "/about/",
  image: "/images/adria-about-new.jpg",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Adria Cross",
  jobTitle: "Personal Stylist",
  description:
    "Professional personal stylist helping clients discover their personal style and build confident wardrobes.",
  url: "https://www.adriacrossedit.com/about/",
  image: "https://www.adriacrossedit.com/images/adria-about-new.jpg",
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="page-hero">
        <div>
          <p className="eyebrow">About Adria</p>
          <h1>Style should feel luxurious and livable.</h1>
          <p>
            Adria is a wife, a mom, a CrossFit coach, and a Brazilian Jiu-Jitsu
            blue belt. Fashion started as a creative outlet and grew into a way of
            helping real people feel clearer and more confident in what they wear.
          </p>
          <p>
            Her approach is rooted in practicality. She works with clients who
            want a wardrobe that looks refined without becoming fragile, precious,
            or disconnected from daily life.
          </p>
          <div className="button-row">
            <Link className="button" href="/contact/">
              Work with Adria
            </Link>
          </div>
        </div>
        <MediaFrame
          alt="Adria Cross in a white blazer and jeans."
          priority
          src="/images/adria-about-new.jpg"
          variant="panel"
        />
      </section>

      <section className="section split-section">
        <div className="panel-card">
          <p className="eyebrow">My Promise</p>
          <h2>I will help your wardrobe work harder without starting from scratch.</h2>
          <p>
            The goal is not to replace everything you own. The goal is to uncover
            the style direction that already fits you and build from there.
          </p>
        </div>
        <div className="panel-card">
          <p className="eyebrow">Who I Work With</p>
          <h2>People with full lives who want style to keep up.</h2>
          <p>
            Professionals, entrepreneurs, parents, and high-output clients often
            reach out when they want their closet to look as capable as the rest of
            their life already is.
          </p>
        </div>
      </section>
    </>
  );
}
