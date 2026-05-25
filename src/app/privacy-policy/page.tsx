import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "Review how Adria Cross Edit collects, uses, protects, and retains personal information submitted through this personal styling website.",
  path: "/privacy-policy/",
});

export default function PrivacyPolicyPage() {
  return (
    <section className="legal-shell">
      <article className="legal-card">
        <h1>Privacy Policy</h1>
        <p>Last Updated: December 24, 2025</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Adria Cross Edit respects your privacy and is committed to protecting
            your personal data. This policy explains how personal information is
            handled when you visit the website or contact the business.
          </p>
        </section>

        <section>
          <h2>2. Data We Collect</h2>
          <ul>
            <li>Identity data such as your name</li>
            <li>Contact data such as email address and phone number</li>
            <li>
              Technical data such as browser type, device information, IP
              address, and analytics-related usage information
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies and Tracking Technologies</h2>
          <p>
            The site uses cookies and similar tracking tools, including Google
            Analytics, to understand traffic and improve the experience. You can
            configure your browser to refuse cookies, though some site behavior
            may be limited if you do.
          </p>
        </section>

        <section>
          <h2>4. How We Use Your Data</h2>
          <ul>
            <li>To provide styling services you request</li>
            <li>To manage communication and scheduling</li>
            <li>To operate and improve the website</li>
          </ul>
        </section>

        <section>
          <h2>5. Disclosures of Your Personal Data</h2>
          <p>
            Personal data is not sold. Information may be shared with trusted
            service providers that support website operations, analytics, or
            communication workflows, but only as needed for those services.
          </p>
        </section>

        <section>
          <h2>6. Data Retention</h2>
          <p>
            Personal data is retained only as long as necessary to fulfill the
            purpose for which it was collected or to satisfy legal, accounting, or
            reporting requirements.
          </p>
        </section>

        <section>
          <h2>7. Children&apos;s Privacy</h2>
          <p>
            The service is not directed to children under 13, and Adria Cross
            Edit does not knowingly collect personal information from children
            under 13.
          </p>
        </section>

        <section>
          <h2>8. Data Security</h2>
          <p>
            Reasonable measures are used to protect personal data from accidental
            loss, misuse, unauthorized access, alteration, or disclosure.
          </p>
        </section>

        <section>
          <h2>9. Your Legal Rights</h2>
          <p>
            Depending on applicable law, you may have rights to access, correct,
            erase, restrict, transfer, or object to the processing of your
            personal data.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>
            Questions about this policy can be sent to{" "}
            <a href="mailto:adria@adriacrossedit.com">adria@adriacrossedit.com</a>.
          </p>
        </section>
      </article>
    </section>
  );
}
