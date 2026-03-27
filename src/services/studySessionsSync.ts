import { supabase } from "../lib/supabase";
import { useWeekStore } from "../stores/useWeekStore";
import type { Database } from "../types/database";
import type { DayEntry } from "../types";

type StudySessionInsert =
  Database["public"]["Tables"]["study_sessions"]["Insert"];

export class StudySessionsSyncService {
  /**
   * Get the start of the current week (Monday)
   */
  private static getWeekStartDate(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split("T")[0];
  }

  /**
   * Calculate duration in minutes from start and stop times
   */
  private static calculateDuration(start: string, stop: string): number {
    if (!start || !stop) return 0;

    const [startHour, startMin] = start.split(":").map(Number);
    const [stopHour, stopMin] = stop.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const stopMinutes = stopHour * 60 + stopMin;

    return Math.max(0, stopMinutes - startMinutes);
  }

  /**
   * Fetch study sessions for current week
   */
  static async fetchWeekSessions(
    userId: string,
  ): Promise<{ error: Error | null }> {
    try {
      const weekStart = this.getWeekStartDate();

      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start_date", weekStart)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const { week } = useWeekStore.getState();
        const updatedWeek = [...week];

        // Group sessions by day
        const sessionsByDay = data.reduce(
          (acc: any, session: any) => {
            if (!acc[session.day_name]) {
              acc[session.day_name] = {};
            }
            acc[session.day_name][`st${session.session_number}`] = {
              start: session.start_time,
              stop: session.stop_time,
            };
            return acc;
          },
          {} as Record<string, any>,
        );

        // Update the week store
        week.forEach((day: DayEntry, index: number) => {
          if (sessionsByDay[day.day]) {
            updatedWeek[index] = {
              ...day,
              st1: sessionsByDay[day.day].st1 || day.st1,
              st2: sessionsByDay[day.day].st2 || day.st2,
              st3: sessionsByDay[day.day].st3 || day.st3,
            };
          }
        });

        // Also fetch topics, ratings, and efficiency notes
        const topicsMap: Record<string, any> = {};
        data.forEach((session: any) => {
          if (!topicsMap[session.day_name]) {
            topicsMap[session.day_name] = {
              topics: session.topics,
              usr: session.self_rating,
              efficiency: session.efficiency_notes,
            };
          }
        });

        week.forEach((day: DayEntry, index: number) => {
          if (topicsMap[day.day]) {
            updatedWeek[index] = {
              ...updatedWeek[index],
              topics: topicsMap[day.day].topics || day.topics,
              usr: topicsMap[day.day].usr || day.usr,
              efficiency: topicsMap[day.day].efficiency || day.efficiency,
            };
          }
        });

        useWeekStore.setState({ week: updatedWeek });
      }

      return { error: null };
    } catch (error) {
      console.error("Error fetching study sessions:", error);
      return { error: error as Error };
    }
  }

  /**
   * Sync a single day's sessions to Supabase
   */
  static async syncDaySessions(
    userId: string,
    dayEntry: DayEntry,
  ): Promise<{ error: Error | null }> {
    try {
      const weekStart = this.getWeekStartDate();

      // Delete existing sessions for this day
      const { error: deleteError } = await supabase
        .from("study_sessions")
        .delete()
        .eq("user_id", userId)
        .eq("week_start_date", weekStart)
        .eq("day_name", dayEntry.day);

      if (deleteError) throw deleteError;

      // Prepare sessions to insert
      const sessions: StudySessionInsert[] = [];

      // Session 1
      if (dayEntry.st1.start && dayEntry.st1.stop) {
        sessions.push({
          user_id: userId,
          week_start_date: weekStart,
          day_name: dayEntry.day,
          session_number: 1,
          start_time: dayEntry.st1.start,
          stop_time: dayEntry.st1.stop,
          duration_minutes: this.calculateDuration(
            dayEntry.st1.start,
            dayEntry.st1.stop,
          ),
          topics: dayEntry.topics,
          self_rating: dayEntry.usr,
          efficiency_notes: dayEntry.efficiency,
        });
      }

      // Session 2
      if (dayEntry.st2.start && dayEntry.st2.stop) {
        sessions.push({
          user_id: userId,
          week_start_date: weekStart,
          day_name: dayEntry.day,
          session_number: 2,
          start_time: dayEntry.st2.start,
          stop_time: dayEntry.st2.stop,
          duration_minutes: this.calculateDuration(
            dayEntry.st2.start,
            dayEntry.st2.stop,
          ),
          topics: dayEntry.topics,
          self_rating: dayEntry.usr,
          efficiency_notes: dayEntry.efficiency,
        });
      }

      // Session 3
      if (dayEntry.st3.start && dayEntry.st3.stop) {
        sessions.push({
          user_id: userId,
          week_start_date: weekStart,
          day_name: dayEntry.day,
          session_number: 3,
          start_time: dayEntry.st3.start,
          stop_time: dayEntry.st3.stop,
          duration_minutes: this.calculateDuration(
            dayEntry.st3.start,
            dayEntry.st3.stop,
          ),
          topics: dayEntry.topics,
          self_rating: dayEntry.usr,
          efficiency_notes: dayEntry.efficiency,
        });
      }

      // Insert sessions
      if (sessions.length > 0) {
        const { error: insertError } = await supabase
          .from("study_sessions")
          .insert(sessions);

        if (insertError) throw insertError;
      }

      return { error: null };
    } catch (error) {
      console.error("Error syncing day sessions:", error);
      return { error: error as Error };
    }
  }

  /**
   * Sync all week sessions to Supabase
   */
  static async syncWeekSessions(
    userId: string,
  ): Promise<{ error: Error | null }> {
    try {
      const { week } = useWeekStore.getState();

      for (const day of week) {
        const { error } = await this.syncDaySessions(userId, day);
        if (error) {
          console.error(`Error syncing ${day.day}:`, error);
          // Continue with other days even if one fails
        }
      }

      return { error: null };
    } catch (error) {
      console.error("Error syncing week sessions:", error);
      return { error: error as Error };
    }
  }

  /**
   * Get total study minutes for current week
   */
  static async getWeekTotalMinutes(
    userId: string,
  ): Promise<{ total: number; error: Error | null }> {
    try {
      const weekStart = this.getWeekStartDate();

      const { data, error } = await supabase
        .from("study_sessions")
        .select("duration_minutes")
        .eq("user_id", userId)
        .eq("week_start_date", weekStart);

      if (error) throw error;

      const total =
        data?.reduce(
          (sum: number, session: any) => sum + session.duration_minutes,
          0,
        ) || 0;

      return { total, error: null };
    } catch (error) {
      console.error("Error getting week total:", error);
      return { total: 0, error: error as Error };
    }
  }

  /**
   * Get most studied topic for current week
   */
  static async getMostStudiedTopic(
    userId: string,
  ): Promise<{ topic: string; error: Error | null }> {
    try {
      const weekStart = this.getWeekStartDate();

      const { data, error } = await supabase
        .from("study_sessions")
        .select("topics, duration_minutes")
        .eq("user_id", userId)
        .eq("week_start_date", weekStart)
        .neq("topics", "");

      if (error) throw error;

      if (!data || data.length === 0) {
        return { topic: "", error: null };
      }

      // Parse topics (comma-separated) and count duration
      const topicDurations: Record<string, number> = {};

      data.forEach((session: any) => {
        const topics = session.topics
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
        topics.forEach((topic: string) => {
          topicDurations[topic] =
            (topicDurations[topic] || 0) + session.duration_minutes;
        });
      });

      // Find topic with most time
      let maxDuration = 0;
      let mostStudiedTopic = "";

      Object.entries(topicDurations).forEach(([topic, duration]) => {
        if (duration > maxDuration) {
          maxDuration = duration;
          mostStudiedTopic = topic;
        }
      });

      return { topic: mostStudiedTopic, error: null };
    } catch (error) {
      console.error("Error getting most studied topic:", error);
      return { topic: "", error: error as Error };
    }
  }

  /**
   * Initialize study sessions sync
   */
  static async initialize(userId: string): Promise<{ error: Error | null }> {
    try {
      await this.fetchWeekSessions(userId);
      return { error: null };
    } catch (error) {
      console.error("Error initializing study sessions sync:", error);
      return { error: error as Error };
    }
  }
}
