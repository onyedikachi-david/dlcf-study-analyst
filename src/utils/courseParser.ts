import type { DayEntry } from '../types';

export function extractMostStudiedCourse(week: DayEntry[]): string {
  const counts: Record<string, number> = {};

  for (const d of week) {
    if (!d.topics.trim()) continue;
    const parts = d.topics.split(/[,;]/).map((t) => t.trim());

    for (const t of parts) {
      if (!t) continue;
      const match = t.match(/[A-Z]{2,4}\s*\d{3}/i);
      const key = match
        ? match[0].toUpperCase().replace(/\s+/g, '')
        : t.split(/\s+/)[0];

      if (key && key.length > 2) {
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }

  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return 'No courses recorded';
  }

  return entries.reduce((max, current) =>
    current[1] > max[1] ? current : max
  )[0];
}

export function parseTopics(topicsStr: string): string[] {
  if (!topicsStr.trim()) return [];
  return topicsStr
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
