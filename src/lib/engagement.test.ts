import { describe, expect, it } from "vitest";
import {
  blogConversionCta,
  clientOutcomes,
  finalConversionCta,
  processSteps,
  trustSignals,
} from "./engagement";
import { services } from "./services";

describe("engagement content", () => {
  it("adds conversion metadata to every service", () => {
    for (const service of services) {
      expect(service.duration.length).toBeGreaterThan(0);
      expect(service.bestFor.length).toBeGreaterThan(0);
      expect(service.includes.length).toBeGreaterThanOrEqual(3);
      expect(service.ctaLabel).toMatch(/Book|Start|Plan/);
    }
  });

  it("defines homepage proof and process content", () => {
    expect(trustSignals).toHaveLength(3);
    expect(clientOutcomes).toHaveLength(3);
    expect(processSteps).toHaveLength(4);
  });

  it("defines clear conversion CTAs", () => {
    expect(finalConversionCta.href).toBe("/contact/");
    expect(blogConversionCta.href).toBe("/contact/");
    expect(finalConversionCta.label).toMatch(/consult/i);
  });
});
