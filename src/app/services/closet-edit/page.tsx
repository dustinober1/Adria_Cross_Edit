import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MediaFrame } from "@/components/MediaFrame";
import { createMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import { services } from "@/lib/services";
import { notFound } from "next/navigation";

const service = services.find((s) => s.id === "closet-edit");

if (!service) {
  notFound();
}

export const metadata: Metadata = createMetadata({
  title: `${service.name} | Personal Stylist in Culpeper, VA`,
  description: service.summary,
  path: `/services/${service.id}/`,
  image: service.image,
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: service.name,
  description: service.summary,
  provider: {
    "@type": "LocalBusiness",
    name: site.name,
    image: absoluteUrl(service.image),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Culpeper",
      addressRegion: "VA",
      addressCountry: "US",
    },
  },
  areaServed: ["Culpeper", "Virginia", "Northern Virginia"],
  offers: {
    "@type": "Offer",
    price: service.price.replace(/[^0-9.]/g, ""),
    priceCurrency: "USD",
  },
};

export default function ClosetEditPage() {
  if (!service) return null;

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="page-hero">
        <div>
          <p className="eyebrow">Service</p>
          <h1>{service.name}</h1>
          <p>{service.summary}</p>
          <p>{service.details}</p>
          <div className="button-row">
            <Link className="button" href="/contact/">
              {service.ctaLabel}
            </Link>
          </div>
        </div>
        <MediaFrame
          alt={service.name}
          priority
          src={service.image}
          variant="hero"
        />
      </section>

      <section className="section">
        <h2>Service Details</h2>
        <div className="grid">
           <article className="service-card">
              <div className="service-card-content">
                  <p><strong>Price:</strong> {service.price}</p>
                  <p><strong>Time:</strong> {service.duration}</p>
                  <p><strong>Best For:</strong> {service.bestFor}</p>
                  <ul className="service-includes">
                      {service.includes.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                  </ul>
              </div>
           </article>
        </div>
      </section>

      <section className="section">
         <div className="panel-card max-w-3xl mx-auto">
            <h2>Why a Closet Edit?</h2>
            <p className="mb-4">
              A closet edit is the foundational step to transforming your wardrobe. We go through every piece to decide what to keep, tailor, donate, or replace.
            </p>
            <p>
              By the end of this session, you&apos;ll have a clear understanding of your current style, a streamlined closet, and a focused shopping list to fill in any gaps, saving you time and money in the long run.
            </p>
         </div>
      </section>
    </>
  );
}
