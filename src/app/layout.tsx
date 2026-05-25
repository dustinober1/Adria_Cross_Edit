import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { absoluteUrl, site } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.owner} | Personal Stylist`,
    template: `%s | ${site.owner}`,
  },
  description: site.description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/icon-192x192.png",
  },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    images: [{ url: absoluteUrl(site.defaultOgImage) }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <Link className="skip-link" href="#main-content">
          Skip to content
        </Link>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${site.gaMeasurementId}`}
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${site.gaMeasurementId}');
          `}
        </Script>
      </body>
    </html>
  );
}
