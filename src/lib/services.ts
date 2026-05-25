export const services = [
  {
    id: "closet-edit",
    name: "Closet Edit",
    summary:
      "A focused wardrobe review that turns what you already own into wearable outfits and clearer next purchases.",
    details:
      "A two-hour session to curate complete outfits, identify what is missing, and give your closet a more confident rhythm.",
    price: "Starting at $395",
    duration: "Two-hour focused session",
    bestFor: "Closets that are full but still feel hard to use",
    includes: [
      "Keep, tailor, donate, and replace guidance",
      "Outfit combinations from pieces you already own",
      "A short list of missing wardrobe priorities",
    ],
    ctaLabel: "Book a closet edit",
    image: "/images/adria-services-new.jpg",
    href: "/services/#closet-edit",
  },
  {
    id: "wardrobe-overhaul",
    name: "Complete Wardrobe Overhaul",
    summary:
      "A larger wardrobe reset for clients who want their closet, shopping choices, and daily style to feel aligned.",
    details:
      "We refine what stays, source what is missing, and build a wardrobe that fits your lifestyle instead of working against it.",
    price: "Starting at $1,200",
    duration: "Multi-step wardrobe reset",
    bestFor: "Major life, body, career, or style transitions",
    includes: [
      "Deep edit of what earns closet space",
      "Wardrobe gap analysis and shopping direction",
      "Repeatable outfit formulas for daily life",
    ],
    ctaLabel: "Plan an overhaul",
    image: "/images/adria-extra-new.jpg",
    href: "/services/#wardrobe-overhaul",
  },
  {
    id: "personal-shopping",
    name: "Personal Shopping Experience",
    summary:
      "A guided shopping session built around your lifestyle, wardrobe gaps, and the pieces that actually earn their place.",
    details:
      "Ideal for targeted shopping, event preparation, seasonal refreshes, or learning how to shop with more clarity.",
    price: "$150/hour, 3-hour minimum",
    duration: "Three-hour minimum",
    bestFor: "Targeted purchases, seasonal refreshes, and event needs",
    includes: [
      "Shopping priorities based on your actual wardrobe",
      "Fit, proportion, and color guidance in real time",
      "Clear yes/no decision support while shopping",
    ],
    ctaLabel: "Start shopping smarter",
    image: "/images/adria-profile-new.jpg",
    href: "/services/#personal-shopping",
  },
  {
    id: "color-analysis",
    name: "Color Analysis",
    summary:
      "A practical color session that helps you understand which shades make your features look clearer and brighter.",
    details:
      "Includes palette guidance for clothes, makeup, and accessories so decisions become easier after the session.",
    price: "Starting at $200",
    duration: "Focused color session",
    bestFor: "Clients who want faster color, makeup, and shopping decisions",
    includes: [
      "Personal color direction for clothes and accessories",
      "Guidance for makeup and wardrobe accents",
      "Color guardrails for future purchases",
    ],
    ctaLabel: "Book color analysis",
    image: "/images/adria-contact-new.jpg",
    href: "/services/#color-analysis",
  },
] as const;
