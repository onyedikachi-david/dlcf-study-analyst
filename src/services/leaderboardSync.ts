import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useLeaderboardStore } from "../stores/useLeaderboardStore";
import type { Tables, InsertDto, ReactionColumn } from "../types/database";
import type { LeaderboardEntry } from "../types";

type LeaderboardRow = Tables<"leaderboard_entries">;

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

function rowToEntry(row: LeaderboardRow): LeaderboardEntry {
  return {
    name: row.name,
    faculty: row.faculty,
    department: row.department,
    level: row.level,
    hours: row.total_minutes,
    pinnedAt: row.pinned_at,
    reactions: {
      cheers: row.cheers,
      fire: row.fire,
      star: row.star,
      heart: row.heart,
    },
    badges: row.badges,
  };
}

export class LeaderboardSyncService {
  private static channel: RealtimeChannel | null = null;

  static async fetchLeaderboard(): Promise<{ error: Error | null }> {
    try {
      const weekStart = getWeekStartDate();

      const { data, error } = await supabase
        .from("leaderboard_entries")
        .select("*")
        .eq("week_start_date", weekStart)
        .order("total_minutes", { ascending: false })
        .order("name", { ascending: true })
        .limit(12);

      if (error) throw error;

      if (data) {
        const entries = data.map(rowToEntry);
        useLeaderboardStore.setState({ entries, hasSeeded: true });
      }

      return { error: null };
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      return { error: toError(err) };
    }
  }

  static async pinToLeaderboard(
    userId: string,
    entry: {
      name: string;
      faculty: string;
      department: string;
      level: string;
      totalMinutes: number;
      badges: string[];
    },
  ): Promise<{ error: Error | null }> {
    try {
      const weekStart = getWeekStartDate();

      const payload: InsertDto<"leaderboard_entries"> = {
        user_id: userId,
        week_start_date: weekStart,
        name: entry.name,
        faculty: entry.faculty,
        department: entry.department,
        level: entry.level,
        total_minutes: entry.totalMinutes,
        pinned_at: Date.now(),
        cheers: 0,
        fire: 0,
        star: 0,
        heart: 0,
        badges: entry.badges,
      };

      const { error } = await supabase
        .from("leaderboard_entries")
        .upsert(payload, { onConflict: "user_id,week_start_date" });

      if (error) throw error;

      useLeaderboardStore.getState().upsert({
        name: entry.name,
        faculty: entry.faculty,
        department: entry.department,
        level: entry.level,
        hours: entry.totalMinutes,
        pinnedAt: Date.now(),
        reactions: { cheers: 0, fire: 0, star: 0, heart: 0 },
        badges: entry.badges,
      });

      return { error: null };
    } catch (err) {
      console.error("Error pinning to leaderboard:", err);
      return { error: toError(err) };
    }
  }

  static async addReactionByName(
    name: string,
    reactionType: ReactionColumn,
  ): Promise<{ error: Error | null }> {
    try {
      const weekStart = getWeekStartDate();

      const { data: entry, error: fetchError } = await supabase
        .from("leaderboard_entries")
        .select("*")
        .eq("name", name)
        .eq("week_start_date", weekStart)
        .single();

      if (fetchError) throw fetchError;
      if (!entry) throw new Error("Entry not found");

      const { error: updateError } = await supabase
        .from("leaderboard_entries")
        .update({ [reactionType]: entry[reactionType] + 1 })
        .eq("id", entry.id);

      if (updateError) throw updateError;

      useLeaderboardStore.getState().react(name, reactionType);
      return { error: null };
    } catch (err) {
      console.error("Error adding reaction:", err);
      return { error: toError(err) };
    }
  }

  static async getUserRank(
    userId: string,
  ): Promise<{ rank: number; error: Error | null }> {
    try {
      const weekStart = getWeekStartDate();

      const { data, error } = await supabase
        .from("leaderboard_entries")
        .select("user_id, total_minutes, name")
        .eq("week_start_date", weekStart)
        .order("total_minutes", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;

      const index = (data ?? []).findIndex((e) => e.user_id === userId);
      return { rank: index === -1 ? 0 : index + 1, error: null };
    } catch (err) {
      console.error("Error getting user rank:", err);
      return { rank: 0, error: toError(err) };
    }
  }

  static async initialize(): Promise<{ error: Error | null }> {
    try {
      await this.fetchLeaderboard();

      if (this.channel) {
        await supabase.removeChannel(this.channel);
      }

      const weekStart = getWeekStartDate();

      this.channel = supabase
        .channel("leaderboard-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "leaderboard_entries",
            filter: `week_start_date=eq.${weekStart}`,
          },
          (payload) => {
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              const row = payload.new as LeaderboardRow;
              useLeaderboardStore.getState().upsert(rowToEntry(row));
            } else if (payload.eventType === "DELETE") {
              void this.fetchLeaderboard();
            }
          },
        )
        .subscribe();

      return { error: null };
    } catch (err) {
      console.error("Error initializing leaderboard sync:", err);
      return { error: toError(err) };
    }
  }

  static async cleanup(): Promise<void> {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
