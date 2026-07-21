import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MediaFrame } from "@/components/MediaFrame";
import { ServiceCard } from "@/components/ServiceCard";
import { createMetadata } from "@/lib/seo";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Personal Styling Services",
  description:
    "Explore personal styling services from Adria Cross Edit, including closet edits, wardrobe styling, personal shopping, and practical style planning.",
  path: "/services/",
  image: "/images/adria-cross-closet-edit-service.jpg",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  provider: {
    "@type": "ProfessionalService",
    name: site.name,
    url: site.url,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Personal Styling Services",
    itemListElement: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.summary,
      },
    })),
  },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="page-hero">
        <div>
          <p className="eyebrow">Services</p>
          <h1>Wardrobe support that meets you where you are.</h1>
          <p>
            Closet edits, color analysis, personal shopping, and larger wardrobe
            resets are all designed to reduce friction and increase confidence.
          </p>
          <p>
            Every service is shaped around real life, not idealized fashion
            content. That is what makes the results stick.
          </p>
          <div className="button-row">
            <Link className="button" href="/contact/">
              Book a free consult
            </Link>
          </div>
        </div>
        <MediaFrame
          alt="Adria Cross offering a closet edit styling session in Culpeper, VA."
          priority
          src="/images/adria-cross-closet-edit-service.jpg"
          variant="panel"
        />
      </section>

      <section className="section">
        <div className="grid">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className="section service-compare">
        <div>
          <p className="eyebrow">Compare Services</p>
          <h2>Choose the right level of wardrobe support.</h2>
        </div>
        <div className="comparison-grid">
          {services.map((service) => (
            <article key={service.id} className="comparison-card">
              <h3>{service.name}</h3>
              <p className="detail">{service.bestFor}</p>
              <dl className="service-meta">
                <div>
                  <dt>Starting at</dt>
                  <dd>{service.price}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{service.duration}</dd>
                </div>
              </dl>
              <div className="flex gap-4">
                <Link className="text-link" href="/contact/">
                  {service.ctaLabel}
                </Link>
                <Link className="text-link" href={service.href}>
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
