import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MediaFrame } from "@/components/MediaFrame";
import { ServiceCard } from "@/components/ServiceCard";
import {
  clientOutcomes,
  finalConversionCta,
  processSteps,
  trustSignals,
} from "@/lib/engagement";
import { createMetadata } from "@/lib/seo";
import { services } from "@/lib/services";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Personal Stylist for Closet Edits and Wardrobe Confidence",
  description:
    "Transform your wardrobe with Adria Cross Edit, a personal styling service for closet edits, wardrobe planning, outfit creation, and confidence-focused style guidance.",
  path: "/",
  image: "/images/adria-hero-new.jpg",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.name,
  founder: site.owner,
  url: site.url,
  image: absoluteUrl("/images/adria-hero-new.jpg"),
  email: site.email,
  priceRange: "$200-$1,300",
  sameAs: [site.instagramUrl],
  serviceType: services.map((service) => service.name),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="page-hero">
        <div>
          <p className="eyebrow">Personal Styling</p>
          <h1>It is not your body. It is your wardrobe.</h1>
          <p>
            Adria Cross Edit helps clients fall back in love with their clothes
            by building wardrobes that fit their body, lifestyle, and next season
            of life.
          </p>
          <p>
            The work is practical, polished, and confidence-focused. No costume.
            No chaos. Just a closet that works harder for you.
          </p>
          <div className="button-row">
            <Link className="button" href="/contact/">
              Book a consultation
            </Link>
            <Link className="button ghost" href="/services/">
              View services
            </Link>
          </div>
        </div>
        <MediaFrame
          alt="Adria Cross holding styled wardrobe pieces and shoes."
          priority
          src="/images/adria-hero-new.jpg"
          variant="hero"
        />
      </section>

      <section className="proof-strip" aria-label="Adria Cross Edit highlights">
        {trustSignals.map((signal) => (
          <div key={signal.label}>
            <strong>{signal.value}</strong>
            <span>{signal.label}</span>
          </div>
        ))}
      </section>

      <section className="section">
        <p className="eyebrow">What I Do</p>
        <h2>Wardrobe clarity for busy, high-performing lives.</h2>
        <div className="grid">
          {services.slice(0, 2).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Client Outcomes</p>
        <h2>What changes after the edit.</h2>
        <div className="outcome-grid">
          {clientOutcomes.map((outcome) => (
            <article key={outcome.title} className="outcome-card">
              <h3>{outcome.title}</h3>
              <p>{outcome.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">How It Works</p>
        <h2>A simple path from closet friction to daily clarity.</h2>
        <div className="process-grid">
          {processSteps.map((step, index) => (
            <article key={step.title} className="process-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-section">
        <div className="panel-card">
          <p className="eyebrow">Why Clients Reach Out</p>
          <h2>The closet is full, but getting dressed still feels hard.</h2>
          <p>
            You buy clothes and still wear the same few pieces. You want polish
            without overthinking. You are ready for a wardrobe that feels more
            aligned with your life and less like a pile of disconnected choices.
          </p>
        </div>
        <div className="panel-card">
          <p className="eyebrow">What Changes</p>
          <h2>More confidence, less friction.</h2>
          <p>
            Adria helps you edit what stays, identify what is missing, and build
            outfit formulas you can actually repeat. The result is a wardrobe that
            saves time and feels like you.
          </p>
        </div>
      </section>

      <section className="cta-band">
        <p className="eyebrow">{finalConversionCta.eyebrow}</p>
        <h2>{finalConversionCta.title}</h2>
        <p>{finalConversionCta.copy}</p>
        <Link className="button" href={finalConversionCta.href}>
          {finalConversionCta.label}
        </Link>
      </section>
    </>
  );
}
