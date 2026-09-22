/**
 * Sequences the terminal can type to itself. A visitor who will not type sees
 * an almost empty screen otherwise, and `?play=<name>` lets a link be aimed at
 * whoever is opening it.
 */
export const tours: Record<string, { label: string; commands: string[] }> = {
  intro: {
    label: "the short version",
    commands: ["whoami", "about", "experience", "projects", "contact"],
  },
  backend: {
    label: "distributed systems and infrastructure",
    commands: ["whoami", "experience", "skills", "gh", "contact"],
  },
  ml: {
    label: "machine learning and research",
    commands: ["whoami", "research", "projects", "skills", "contact"],
  },
  everything: {
    label: "all of it",
    commands: [
      "about", "experience", "research", "projects", "finance",
      "skills", "achievements", "leadership", "education", "contact",
    ],
  },
};

export const tourNames = Object.keys(tours);
