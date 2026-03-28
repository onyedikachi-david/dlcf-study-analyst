import type { Badge, DayEntry, DayName, LeaderboardEntry } from "../types";

export const DAYS: DayName[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const STORAGE_KEYS = {
  PROFILE: "@dlcf/profile",
  WEEK: "@dlcf/week",
  LEADERBOARD: "@dlcf/leaderboard",
  GOAL_MINS: "@dlcf/goal_mins",
  PARTNER: "@dlcf/partner",
  FACTS: "@dlcf/facts",
  ARCHIVES: "@dlcf/archives",
  EARNED_BADGES: "@dlcf/earned_badges",
  SEEDED: "@dlcf/seeded",
  TIMER: "@dlcf/timer",
} as const;

export const ALL_BADGES: Badge[] = [
  {
    id: "streak3",
    label: "3-Day Streak",
    icon: "🔥",
    description: "Study 3+ consecutive days",
  },
  {
    id: "streak5",
    label: "5-Day Streak",
    icon: "⚡",
    description: "Study 5+ consecutive days",
  },
  {
    id: "streak7",
    label: "7-Day Streak",
    icon: "💎",
    description: "Study all 7 days",
  },
  {
    id: "4h_champ",
    label: "4h Champion",
    icon: "🏆",
    description: "Average >= 4 hours/day",
  },
  {
    id: "consistency",
    label: "Consistency Pro",
    icon: "🎯",
    description: "All 7 days have >= 2 hours each",
  },
  {
    id: "early_bird",
    label: "Early Bird",
    icon: "🐦",
    description: "Any session starts before 07:00",
  },
  {
    id: "night_owl",
    label: "Night Owl",
    icon: "🦉",
    description: "Any session starts at or after 22:00",
  },
  {
    id: "top3",
    label: "Top 3",
    icon: "🥇",
    description: "Ranked in top 3 on the board",
  },
  {
    id: "goal_crusher",
    label: "Goal Crusher",
    icon: "🎉",
    description: "Total >= weekly goal",
  },
  {
    id: "lvl5",
    label: "Level 5+",
    icon: "⭐",
    description: "Reach level 5 (1500+ total minutes)",
  },
  {
    id: "fact_master",
    label: "Fact Master",
    icon: "📚",
    description: "Save 10+ facts in the vault",
  },
];

export const DEFAULT_GOAL_MINS = 28 * 60; // 28 hours in minutes

export const POMODORO = {
  WORK_MINS: 25,
  BREAK_MINS: 5,
  LONG_BREAK_MINS: 15,
  POMODOROS_PER_LONG_BREAK: 4,
} as const;

export const createEmptySession = () => ({ start: "", stop: "" });

export const createEmptyDayEntry = (day: DayName): DayEntry => ({
  day,
  st1: createEmptySession(),
  st2: createEmptySession(),
  st3: createEmptySession(),
  usr: 0,
  topics: "",
  efficiency: "",
});

export const createEmptyWeek = (): DayEntry[] => DAYS.map(createEmptyDayEntry);

export const DEMO_PINS: LeaderboardEntry[] = [
  {
    name: "Ada Lovelace",
    faculty: "Sciences",
    department: "Mathematics",
    level: "300L",
    hours: 26 * 60 + 30,
    pinnedAt: Date.now() - 86400000 * 6,
    reactions: { cheers: 12, fire: 8, star: 5, heart: 3 },
    badges: ["streak7", "4h_champ", "consistency"],
  },
  {
    name: "Isaac Newton",
    faculty: "Sciences",
    department: "Physics",
    level: "400L",
    hours: 24 * 60 + 15,
    pinnedAt: Date.now() - 86400000 * 5,
    reactions: { cheers: 9, fire: 6, star: 4, heart: 2 },
    badges: ["streak5", "4h_champ", "early_bird"],
  },
  {
    name: "Marie Curie",
    faculty: "Sciences",
    department: "Chemistry",
    level: "500L",
    hours: 22 * 60 + 45,
    pinnedAt: Date.now() - 86400000 * 4,
    reactions: { cheers: 15, fire: 10, star: 7, heart: 5 },
    badges: ["streak7", "consistency", "goal_crusher"],
  },
  {
    name: "Alan Turing",
    faculty: "Engineering",
    department: "Computer Science",
    level: "300L",
    hours: 20 * 60 + 10,
    pinnedAt: Date.now() - 86400000 * 3,
    reactions: { cheers: 7, fire: 4, star: 3, heart: 1 },
    badges: ["streak3", "night_owl"],
  },
  {
    name: "Grace Hopper",
    faculty: "Engineering",
    department: "Computer Science",
    level: "200L",
    hours: 18 * 60 + 50,
    pinnedAt: Date.now() - 86400000 * 2,
    reactions: { cheers: 6, fire: 3, star: 2, heart: 2 },
    badges: ["streak5", "early_bird"],
  },
  {
    name: "Rosalind Franklin",
    faculty: "Sciences",
    department: "Biochemistry",
    level: "400L",
    hours: 17 * 60,
    pinnedAt: Date.now() - 86400000,
    reactions: { cheers: 5, fire: 2, star: 1, heart: 1 },
    badges: ["streak3", "fact_master"],
  },
];

export const PIN_CARD_COLORS = [
  "#fff8dc",
  "#ffe4e1",
  "#f0fff0",
  "#e6f3ff",
  "#f5f0ff",
  "#fff5e6",
  "#f0ffff",
  "#fff0f5",
  "#fffff0",
  "#f0f8ff",
  "#fdf5e6",
  "#f5fffa",
];

export const THUMBTACK_COLORS = [
  "#e53e3e",
  "#dd6b20",
  "#d69e2e",
  "#38a169",
  "#3182ce",
  "#805ad5",
  "#d53f8c",
  "#2b6cb0",
  "#c05621",
  "#2f855a",
  "#6b46c1",
  "#b83280",
];

export const TAPE_COLORS = [
  "rgba(255,228,181,0.7)",
  "rgba(173,216,230,0.6)",
  "rgba(255,218,185,0.7)",
  "rgba(216,191,216,0.6)",
  "rgba(255,255,224,0.7)",
];

export const CORK_BOARD = {
  BACKGROUND: "#c4956a",
  BACKGROUND_DARK: "#8a6a4a",
  FRAME_COLORS: ["#8B5E3C", "#A0724D", "#6B4226", "#A0724D", "#8B5E3C"],
} as const;

export const SHARE_CARD_GRADIENT = {
  START: "#6366f1",
  END: "#9333ea",
} as const;
