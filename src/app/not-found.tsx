import Link from "next/link";

export default function NotFound() {
  return (
    <section className="legal-shell">
      <article className="legal-card">
        <p className="eyebrow">404</p>
        <h1>Page not found.</h1>
        <p>
          The page you were looking for is no longer available at this address.
          Use one of the main routes below to keep moving.
        </p>
        <div className="button-row">
          <Link className="button" href="/">
            Home
          </Link>
          <Link className="button ghost" href="/blog/">
            Blog
          </Link>
          <Link className="button ghost" href="/contact/">
            Contact
          </Link>
        </div>
      </article>
    </section>
  );
}
