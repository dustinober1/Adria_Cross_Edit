import Link from "next/link";
import { navigation } from "@/lib/navigation";
import { site } from "@/lib/site";

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
        <ul className="nav-menu">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
