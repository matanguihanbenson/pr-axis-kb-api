import servicesData from "../data/kb/services.json";
import packagesData from "../data/kb/packages.json";
import pricingRulesData from "../data/kb/pricing-rules.json";
import customBuildsData from "../data/kb/custom-builds.json";
import processData from "../data/kb/process.json";
import faqsData from "../data/kb/faqs.json";

export interface KbEntry {
  id: string;
  topic: string;
  keywords: string[];
  title: string;
  answer: string;
  source: string;
  updated_at: string;
}

export const TOPICS = [
  "services",
  "packages",
  "pricing-rules",
  "custom-builds",
  "process",
  "faqs",
] as const;

export type Topic = (typeof TOPICS)[number];

export function isTopic(value: string): value is Topic {
  return (TOPICS as readonly string[]).includes(value);
}

const DATA: Record<Topic, KbEntry[]> = {
  services: servicesData.entries as KbEntry[],
  packages: packagesData.entries as KbEntry[],
  "pricing-rules": pricingRulesData.entries as KbEntry[],
  "custom-builds": customBuildsData.entries as KbEntry[],
  process: processData.entries as KbEntry[],
  faqs: faqsData.entries as KbEntry[],
};

export function listEntries(topic?: string, q?: string): KbEntry[] {
  let entries: KbEntry[];
  if (topic) {
    entries = [...DATA[topic as Topic]];
  } else {
    entries = TOPICS.flatMap((t) => DATA[t]);
  }
  if (q) {
    const needle = q.toLowerCase();
    entries = entries.filter((e) => {
      const haystack = [e.id, e.title, e.answer, ...e.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }
  return entries;
}

export function getEntry(id: string): KbEntry | undefined {
  return TOPICS.flatMap((t) => DATA[t]).find((e) => e.id === id);
}

export function validateEntry(body: unknown): {
  entry?: KbEntry;
  error?: string;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.id)) {
    return {
      error: "id must be a lowercase slug, for example service-brand-design",
    };
  }
  if (typeof b.topic !== "string" || !isTopic(b.topic)) {
    return { error: `topic must be one of: ${TOPICS.join(", ")}` };
  }
  if (
    !Array.isArray(b.keywords) ||
    b.keywords.length === 0 ||
    !b.keywords.every((k) => typeof k === "string" && k.length > 0)
  ) {
    return { error: "keywords must be a non-empty array of strings" };
  }
  for (const field of ["title", "answer", "source"] as const) {
    if (typeof b[field] !== "string" || (b[field] as string).trim() === "") {
      return { error: `${field} must be a non-empty string` };
    }
  }
  return {
    entry: {
      id: b.id as string,
      topic: b.topic as string,
      keywords: b.keywords as string[],
      title: (b.title as string).trim(),
      answer: (b.answer as string).trim(),
      source: (b.source as string).trim(),
      updated_at: new Date().toISOString(),
    },
  };
}
