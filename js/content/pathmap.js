/* Curriculum tiers. Each lesson sits in one tier so the map can count them. */
import { tracks } from "./catalog.js";

export const TIERS = [
  {
    id: "foundations",
    title: "Foundations",
    blurb: "The lab, first programs, values, names, text, and files.",
    test: (track, id) => track === "start" || (track === "fundamentals" && ["syntax", "types", "names", "strings", "files"].includes(id)),
  },
  {
    id: "core",
    title: "Core language",
    blurb: "Choices, functions, classes, comprehensions, and the pieces that build on them.",
    test: (track, id) => track === "fundamentals" && ["control", "functions", "classes", "comprehensions", "lambdas", "iterators", "errors"].includes(id),
  },
  {
    id: "data",
    title: "Data and structures",
    blurb: "Collections, files of rows, and the standard tools that read them.",
    test: (track, id) => track === "dsa" || track === "data" || id === "regular-expressions",
  },
  {
    id: "design",
    title: "Program design",
    blurb: "Modules, tests, decorators, with blocks, and inheritance.",
    test: (track, id) => track === "fundamentals" && ["modules", "testing-packaging", "decorators", "with-blocks", "inheritance"].includes(id),
  },
  {
    id: "applied",
    title: "Applied",
    blurb: "Web, data work, AI vocabulary, automation, and when a program should wait.",
    test: (track, id) => ["web", "ai", "automation"].includes(track) || (track === "async" && id === "when-which"),
  },
  {
    id: "professional",
    title: "Professional",
    blurb: "Typing, packaging, logging, tracebacks, and the rest of a working setup.",
    test: (track, id) => ["typing", "stdlib", "tooling", "licensing"].includes(track) && id !== "regular-expressions" || ["logging-well", "tracebacks"].includes(id) || (track === "async" && id !== "when-which"),
  },
  {
    id: "interview",
    title: "Interview and career",
    blurb: "Practice projects, certificates, and how to talk about the work.",
    test: (track) => ["career", "certifications", "projects"].includes(track),
  },
];

export function tierFor(trackId, lessonId) {
  return TIERS.find((tier) => tier.test(trackId, lessonId)) || TIERS[TIERS.length - 1];
}

export function tierGroups() {
  const groups = TIERS.map((tier) => ({ ...tier, lessons: [] }));
  const byId = Object.fromEntries(groups.map((tier) => [tier.id, tier]));
  tracks.forEach((track) => {
    track.lessons.forEach((lesson) => {
      const tier = tierFor(track.id, lesson.id);
      byId[tier.id].lessons.push({
        href: `#/lesson/${track.id}/${lesson.id}`,
        title: lesson.title,
        minutes: lesson.minutes,
      });
    });
  });
  return groups;
}
