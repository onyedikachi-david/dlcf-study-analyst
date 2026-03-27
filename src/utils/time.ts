export function parseTimeToMinutes(time: string): number {
  if (!time || !time.includes(':')) return 0;
  const [hours, mins] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(mins)) return 0;
  return hours * 60 + mins;
}

export function durationMinutes(start: string, stop: string): number {
  const s = parseTimeToMinutes(start);
  const e = parseTimeToMinutes(stop);
  if (s === 0 && e === 0) return 0;
  if (s === 0 || e === 0) return 0;
  return e >= s ? e - s : 1440 - s + e; // overnight wrap
}

export function minutesToHrs(minutes: number): string {
  if (minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function formatTimeFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getCurrentDayIndex(): number {
  const day = new Date().getDay();
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  return day === 0 ? 6 : day - 1;
}

export function isMonday(): boolean {
  return new Date().getDay() === 1;
}

export function getWeekStartTimestamp(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}
