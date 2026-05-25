import Link from "next/link";
import { navigation } from "@/lib/navigation";
import { site } from "@/lib/site";

function NavLinks() {
  return (
    <ul className="nav-menu">
      {navigation.map((item) => (
        <li key={item.href}>
          <Link href={item.href}>{item.label}</Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label={`${site.name} home`}>
          <span className="brand-mark">AC</span>
          <span className="brand-copy">
            <strong>{site.owner}</strong>
            <span>Personal Stylist</span>
          </span>
        </Link>

        <div className="desktop-nav">
          <NavLinks />
          <Link className="button nav-cta" href="/contact/">
            Book Free Consult
          </Link>
        </div>

        <details className="mobile-nav">
          <summary aria-label="Open navigation">Menu</summary>
          <div className="mobile-nav__panel">
            <NavLinks />
            <Link className="button nav-cta" href="/contact/">
              Book Free Consult
            </Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
