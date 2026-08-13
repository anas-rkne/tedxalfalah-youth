const BASE_URL = process.env.BASE_URL || "https://www.tedxalfalahyouth.com";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TEDxAlFalah Youth",
    url: BASE_URL,
    logo: `${BASE_URL}/my-favicon/favicon-96x96.png`,
    description:
      "An independently organized TEDx event showcasing young voices and real ideas.",
    sameAs: [
      "https://www.instagram.com/tedxalfalahyouth",
      "https://www.linkedin.com/company/tedxalfalahyouth",
      "https://x.com/tedxalfalahyouth",
    ],
  };
}

export function eventSchema(eventInfo: {
  title?: string;
  date?: string;
  venue?: string;
  description?: string;
  performers?: { name: string; url?: string }[];
}) {
  const name = eventInfo.title || "TEDxAlFalah Youth";
  const startDate = eventInfo.date || "2026-12-19";
  const location = eventInfo.venue || "Abu Dhabi, United Arab Emirates";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    startDate,
    endDate: startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: location,
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
        addressCountry: "AE",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "TEDxAlFalah Youth",
      url: BASE_URL,
    },
  };

  if (eventInfo.description) {
    schema.description = eventInfo.description;
  }

  if (eventInfo.performers?.length) {
    schema.performer = eventInfo.performers.map((p) => ({
      "@type": "Person",
      name: p.name,
      ...(p.url && { url: p.url }),
    }));
  }

  return schema;
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TEDxAlFalah Youth",
    url: BASE_URL,
    description:
      "Young voices. Real ideas. The future starts earlier than we think.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/?s={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbListSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function personSchema(person: {
  name: string;
  description?: string;
  image?: string | null;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
  };

  if (person.description) schema.description = person.description;
  if (person.image) schema.image = person.image;

  return schema;
}
