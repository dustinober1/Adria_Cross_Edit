import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Terms of Service",
  description:
    "Read the service terms for Adria Cross Edit, including bookings, cancellations, payments, intellectual property, and website use.",
  path: "/terms-of-service/",
});

export default function TermsPage() {
  return (
    <section className="legal-shell">
      <article className="legal-card">
        <h1>Terms of Service</h1>
        <p>Last Updated: December 24, 2025</p>

        <section>
          <h2>1. Agreement to Terms</h2>
          <p>
            By using this website or booking styling services, you agree to these
            terms. If you do not agree, you should not use the service.
          </p>
        </section>

        <section>
          <h2>2. Services</h2>
          <p>
            Adria Cross Edit provides personal styling, wardrobe consultation, and
            related services. Services may change over time as the business
            evolves.
          </p>
        </section>

        <section>
          <h2>3. Appointments and Cancellations</h2>
          <p>
            Appointments can be requested through the website. At least 24 hours
            notice is requested for cancellations or rescheduling. Repeated late
            cancellations may require non-refundable deposits for future bookings.
          </p>
        </section>

        <section>
          <h2>4. Payment Terms</h2>
          <p>
            Payment terms are agreed at booking. Pricing may change over time. The
            business reserves the right to refuse service when necessary.
          </p>
        </section>

        <section>
          <h2>5. User Conduct</h2>
          <p>
            You agree not to use the website for unlawful purposes or in a way
            that could damage, disable, or impair the site. You also agree not to
            attempt unauthorized access to the website or its users&apos; data.
          </p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            Site content, design, graphics, and related materials are protected by
            copyright and trademark laws. Reuse without permission is prohibited.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            Adria Cross Edit and its owner are not liable for indirect,
            incidental, special, consequential, or punitive damages arising from
            use of the website or services.
          </p>
        </section>

        <section>
          <h2>8. Governing Law</h2>
          <p>
            These terms are governed by the laws of the Commonwealth of Virginia,
            United States, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2>9. Changes to Terms</h2>
          <p>
            These terms may be updated from time to time. The effective date at
            the top of the page reflects the latest revision.
          </p>
        </section>

        <section>
          <h2>10. Contact Information</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a href="mailto:adria@adriacrossedit.com">adria@adriacrossedit.com</a>.
          </p>
        </section>
      </article>
    </section>
  );
}
