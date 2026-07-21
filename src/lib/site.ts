export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adriacrossedit.com";

export const site = {
  name: "Adria Cross Edit",
  owner: "Adria Cross",
  url: SITE_URL,
  email: "adria@adriacrossedit.com",
  description:
    "Personal styling, closet edits, wardrobe planning, and confidence-focused style guidance from Adria Cross.",
  gaMeasurementId:
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-KY9029WBWZ",
  instagramUrl: "https://www.instagram.com/adriacrossedit/",
  bookingUrl:
    "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3wUMcfi9PCbrbgE118d-hvfmKZwgdv39eg488EKFZ8jbFP-yJMlaNEaRHs2Lxe_6Fjz7E-WNSK",
  defaultOgImage: "/images/adria-cross-personal-stylist-culpeper.jpg",
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
