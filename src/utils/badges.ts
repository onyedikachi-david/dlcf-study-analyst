import type { DayEntry, WeekTotals } from '../types';
import { durationMinutes, parseTimeToMinutes } from './time';

interface ComputeBadgesParams {
  streak: number;
  totals: WeekTotals;
  week: DayEntry[];
  goalMins: number;
  level: number;
  factsCount: number;
}

export function computeBadges(params: ComputeBadgesParams): string[] {
  const { streak, totals, week, goalMins, level, factsCount } = params;
  const badges: string[] = [];
  const studiedDays = totals.perDay.filter((m) => m > 0).length;

  if (streak >= 3) badges.push('streak3');
  if (streak >= 5) badges.push('streak5');
  if (streak >= 7) badges.push('streak7');

  if (studiedDays > 0 && totals.total / studiedDays >= 240) {
    badges.push('4h_champ');
  }

  if (studiedDays === 7 && totals.perDay.every((m) => m >= 120)) {
    badges.push('consistency');
  }

  for (const d of week) {
    for (const sk of ['st1', 'st2', 'st3'] as const) {
      const session = d[sk];
      if (session.start) {
        const mins = parseTimeToMinutes(session.start);
        if (mins > 0 && mins < 420) {
          if (!badges.includes('early_bird')) badges.push('early_bird');
        }
        if (mins >= 1320) {
          if (!badges.includes('night_owl')) badges.push('night_owl');
        }
      }
    }
  }

  if (totals.total >= goalMins && goalMins > 0) {
    badges.push('goal_crusher');
  }

  if (level >= 5) {
    badges.push('lvl5');
  }

  if (factsCount >= 10) {
    badges.push('fact_master');
  }

  return [...new Set(badges)];
}

export function computeStreak(week: DayEntry[]): number {
  let streak = 0;
  for (const d of week) {
    const dayTotal =
      durationMinutes(d.st1.start, d.st1.stop) +
      durationMinutes(d.st2.start, d.st2.stop) +
      durationMinutes(d.st3.start, d.st3.stop);
    if (dayTotal > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function computeWeekTotals(week: DayEntry[], goalMins: number): WeekTotals {
  const perDay = week.map((d) => {
    return (
      durationMinutes(d.st1.start, d.st1.stop) +
      durationMinutes(d.st2.start, d.st2.stop) +
      durationMinutes(d.st3.start, d.st3.stop)
    );
  });

  const total = perDay.reduce((sum, m) => sum + m, 0);
  const progress = goalMins > 0 ? Math.min(100, Math.round((total / goalMins) * 100)) : 0;

  return { perDay, total, progress };
}

export function computeLevel(totalMinutes: number): { level: number; xp: number; levelPct: number } {
  const level = Math.floor(totalMinutes / 300) + 1;
  const xp = totalMinutes % 300;
  const levelPct = Math.round((xp / 300) * 100);
  return { level, xp, levelPct };
}
