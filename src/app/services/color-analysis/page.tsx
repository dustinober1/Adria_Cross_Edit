import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MediaFrame } from "@/components/MediaFrame";
import { createMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import { services } from "@/lib/services";
import { notFound } from "next/navigation";

const service = services.find((s) => s.id === "color-analysis");

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

export default function ColorAnalysisPage() {
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
            <h2>Discover Your Best Colors</h2>
            <p className="mb-4">
              Wearing the right colors can dramatically enhance your natural features, making you look more vibrant and rested. In our Color Analysis session, we&apos;ll determine your ideal color palette based on your skin tone, hair, and eye color.
            </p>
            <p>
              You&apos;ll leave with a clear understanding of which shades to embrace and which to avoid, giving you a powerful tool for building a cohesive and flattering wardrobe.
            </p>
         </div>
      </section>
    </>
  );
}
