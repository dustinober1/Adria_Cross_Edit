import Link from "next/link";
import { MediaFrame } from "@/components/MediaFrame";
import type { services } from "@/lib/services";

type Service = (typeof services)[number];

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article id={service.id} className="service-card">
      <MediaFrame
        alt={`${service.name} styling service`}
        src={service.image}
        variant="card"
      />
      <div className="card-copy">
        <p className="eyebrow">{service.price}</p>
        <h2>{service.name}</h2>
        <p>{service.summary}</p>
        <dl className="service-meta">
          <div>
            <dt>Best for</dt>
            <dd>{service.bestFor}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{service.duration}</dd>
          </div>
        </dl>
        <ul className="service-includes">
          {service.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link className="button service-card__cta" href="/contact/">
          {service.ctaLabel}
        </Link>
      </div>
    </article>
  );
}
