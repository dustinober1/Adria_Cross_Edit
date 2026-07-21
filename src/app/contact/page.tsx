import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MediaFrame } from "@/components/MediaFrame";
import { createMetadata } from "@/lib/seo";
import { faqs } from "@/lib/faqs";
import { site } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Contact Adria Cross",
  description:
    "Book a consultation with Adria Cross Edit for closet edits, wardrobe styling, personal shopping, and confidence-focused style guidance.",
  path: "/contact/",
  image: "/images/adria-cross-color-analysis-service.jpg",
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <section className="page-hero">
        <div>
          <p className="eyebrow">Contact</p>
          <h1>Book a free consultation.</h1>
          <p>
            Choose a time on the calendar or email Adria directly if you want to
            talk through your wardrobe goals before booking.
          </p>
          <div className="button-row">
            <a className="button" href="#calendar">
              Choose a time
            </a>
            <a className="button ghost" href={`mailto:${site.email}`}>
              Email Adria
            </a>
          </div>
        </div>
        <MediaFrame
          alt="Adria Cross seated and smiling during a styling portrait."
          priority
          src="/images/adria-cross-wardrobe-overhaul-service.jpg"
          variant="panel"
        />
      </section>

      <section className="section split-section">
        <div className="contact-card" id="calendar">
          <p className="eyebrow">Calendar</p>
          <h2>Choose your consultation time</h2>
          <iframe
            src={site.bookingUrl}
            title="Book a consultation with Adria Cross"
            loading="lazy"
            width="100%"
            height="760"
            style={{ border: 0, borderRadius: "16px", background: "#fff" }}
          />
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <article key={faq.question} className="faq-card">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
