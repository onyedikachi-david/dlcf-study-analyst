export type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Session {
  start: string; // "HH:mm" or ""
  stop: string;  // "HH:mm" or ""
}

export interface DayEntry {
  day: DayName;
  st1: Session;
  st2: Session;
  st3: Session;
  usr: number;       // 0–10 self-rating
  topics: string;    // comma-separated course codes / topics
  efficiency: string; // free-text self-assessment
}

export interface Profile {
  name: string;
  faculty: string;
  department: string;
  level: string;
  accountabilityPartner: string;
  avatarUri?: string;
}

export interface Reaction {
  cheers: number;
  fire: number;
  star: number;
  heart: number;
}

export interface LeaderboardEntry {
  name: string;
  faculty: string;
  department: string;
  level: string;
  hours: number;        // total minutes for the week
  pinnedAt: number;     // Date.now() timestamp
  reactions: Reaction;
  badges: string[];     // earned badge IDs
}

export interface ArchiveEntry {
  id: number;        // Date.now() timestamp
  total: number;     // total minutes
  topic: string;     // most-studied course
  rank: number;      // rank on board at archive time (0 if not on board)
  badges: string[];  // earned badge IDs at archive time
}

export interface WeekTotals {
  perDay: number[];    // minutes per day (length 7)
  total: number;       // sum of perDay
  progress: number;    // percentage of weekly goal (0–100, clamped)
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface TimerSession {
  subject: string;       // e.g., "CHM101"
  durationMins: number;  // 25 for work, 5 for break
  elapsedMins: number;   // actual time studied
  startedAt: number;     // timestamp
  type: 'work' | 'break';
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  pomodoroCount: number; // how many 25-min sessions completed
}
