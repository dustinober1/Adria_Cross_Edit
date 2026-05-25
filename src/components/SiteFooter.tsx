import Link from "next/link";
import { navigation } from "@/lib/navigation";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <p className="eyebrow">Adria Cross Edit</p>
          <h2>{site.owner}</h2>
          <p>{site.description}</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-links">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/privacy-policy/">Privacy</Link>
          <Link href="/terms-of-service/">Terms</Link>
        </nav>
        <div className="footer-contact">
          <Link className="button footer-cta" href="/contact/">
            Book Free Consult
          </Link>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={site.instagramUrl} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
