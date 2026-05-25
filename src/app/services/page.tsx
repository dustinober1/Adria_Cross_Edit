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
  image: "/images/adria-services-new.jpg",
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
        </div>
        <MediaFrame
          alt="Adria Cross posing with a phone during a styling session."
          priority
          src="/images/adria-services-new.jpg"
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
    </>
  );
}
