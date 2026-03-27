import {
  useLeaderboardStore,
  useProfileStore,
  useWeekStore,
} from "@/src/stores";
import { Colors } from "@/src/theme/colors";
import type { Reaction } from "@/src/types";
import type { ReactionColumn } from "@/src/types/database";
import { minutesToHrs, durationMinutes } from "@/src/utils/time";
import { LeaderboardSyncService } from "@/src/services/leaderboardSync";
import { useAuth } from "@/src/contexts/AuthContext";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "all" | "faculty" | "department";

export default function BoardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuth();
  const { entries, react, seedIfNeeded } = useLeaderboardStore();
  const { profile } = useProfileStore();
  const { week } = useWeekStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const [pinning, setPinning] = useState(false);

  useEffect(() => {
    seedIfNeeded();
  }, [seedIfNeeded]);

  const filteredEntries = entries.filter((e) => {
    if (filter === "faculty" && profile.faculty) {
      return e.faculty === profile.faculty;
    }
    if (filter === "department" && profile.department) {
      return e.department === profile.department;
    }
    return true;
  });

  const handleReact = useCallback(
    async (name: string, type: keyof Reaction) => {
      if (!user?.id) {
        Toast.show({
          type: "error",
          text1: "Authentication Required",
          text2: "Please sign in to react",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      react(name, type);

      const reactionType =
        type === "fire" ? "fire" : type === "cheers" ? "cheers" : "star";
      const { error } = await LeaderboardSyncService.addReactionByName(
        name,
        reactionType as ReactionColumn,
      );

      if (error) {
        console.error("Failed to add reaction:", error);
        Toast.show({
          type: "error",
          text1: "Failed to add reaction",
          text2: "Please try again",
          position: "top",
          visibilityTime: 2000,
        });
      }
    },
    [react, user],
  );

  const handlePinToBoard = useCallback(async () => {
    if (!user?.id) {
      Toast.show({
        type: "error",
        text1: "Authentication Required",
        text2: "Please sign in to pin to leaderboard",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    const totalMinutes = week.reduce((sum, d) => {
      return (
        sum +
        durationMinutes(d.st1.start, d.st1.stop) +
        durationMinutes(d.st2.start, d.st2.stop) +
        durationMinutes(d.st3.start, d.st3.stop)
      );
    }, 0);

    if (totalMinutes === 0) {
      Toast.show({
        type: "info",
        text1: "No Study Time Recorded",
        text2: "Complete some study sessions first!",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    setPinning(true);
    try {
      const { error } = await LeaderboardSyncService.pinToLeaderboard(user.id, {
        name: profile.name,
        faculty: profile.faculty,
        department: profile.department,
        level: profile.level,
        totalMinutes,
        badges: [],
      });

      if (error) {
        console.error("Failed to pin to leaderboard:", error);
        Toast.show({
          type: "error",
          text1: "Pin Failed",
          text2: "Failed to pin to leaderboard. Please try again.",
          position: "top",
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Success! 🎉",
          text2: "You're now on the leaderboard!",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } finally {
      setPinning(false);
    }
  }, [
    user,
    week,
    profile.name,
    profile.faculty,
    profile.department,
    profile.level,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              🏆 Leaderboard
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              This week&apos;s top performers
            </Text>
          </View>
          <View
            style={[
              styles.rankBadge,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Text style={[styles.rankBadgeText, { color: colors.primary }]}>
              #{entries.findIndex((e) => e.name === profile.name) + 1 || "?"}
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(["all", "faculty", "department"] as FilterType[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor:
                    filter === f ? colors.primary : colors.surface,
                  shadowColor: filter === f ? colors.primary : "#000",
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? "#fff" : colors.text },
                ]}
              >
                {f === "all"
                  ? "🌍 All"
                  : f === "faculty"
                    ? "🎓 Faculty"
                    : "📚 Dept"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Pin to Board Button */}
        <Pressable
          onPress={handlePinToBoard}
          disabled={pinning}
          style={[
            styles.pinButton,
            { backgroundColor: colors.primary },
            pinning && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.pinButtonText}>
            {pinning ? "⏳ Pinning..." : "📌 Pin My Progress"}
          </Text>
        </Pressable>
      </View>

      {/* Leaderboard List */}
      <View style={styles.listContainer}>
        <ScrollView
          contentContainerStyle={styles.boardContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top 3 Podium */}
          {filteredEntries.length > 0 && (
            <View style={styles.podium}>
              {filteredEntries.slice(0, 3).map((entry, index) => (
                <View
                  key={entry.name}
                  style={[
                    styles.podiumItem,
                    { backgroundColor: colors.surface },
                    index === 0 && styles.podiumFirst,
                  ]}
                >
                  <Text style={styles.podiumRank}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </Text>
                  <Text
                    style={[styles.podiumName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {entry.name.split(" ")[0]}
                  </Text>
                  <Text style={[styles.podiumHours, { color: colors.primary }]}>
                    {minutesToHrs(entry.hours)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Rest of List */}
          <View style={styles.listSection}>
            <Text style={[styles.listTitle, { color: colors.textSecondary }]}>
              📋 All Students ({filteredEntries.length})
            </Text>
            {filteredEntries.map((entry, index) => (
              <View
                key={entry.name}
                style={[styles.listItem, { backgroundColor: colors.surface }]}
              >
                <View style={styles.listItemLeft}>
                  <Text
                    style={[
                      styles.listItemRank,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <View style={styles.listItemInfo}>
                    <Text style={[styles.listItemName, { color: colors.text }]}>
                      {entry.name}
                    </Text>
                    <Text
                      style={[
                        styles.listItemMeta,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {entry.faculty} • {entry.level}
                    </Text>
                  </View>
                </View>
                <View style={styles.listItemRight}>
                  <Text
                    style={[styles.listItemHours, { color: colors.primary }]}
                  >
                    {minutesToHrs(entry.hours)}
                  </Text>
                  <View style={styles.reactionsRow}>
                    <Pressable
                      onPress={() => handleReact(entry.name, "fire")}
                      style={styles.reactionBtn}
                    >
                      <Text style={styles.reactionIcon}>🔥</Text>
                      <Text
                        style={[
                          styles.reactionCount,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {entry.reactions.fire}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleReact(entry.name, "cheers")}
                      style={styles.reactionBtn}
                    >
                      <Text style={styles.reactionIcon}>👏</Text>
                      <Text
                        style={[
                          styles.reactionCount,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {entry.reactions.cheers}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📌</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No students yet!
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                Submit your study analyst to appear here.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  rankBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankBadgeText: {
    fontSize: 16,
    fontWeight: "800",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pinButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  pinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  boardContent: {
    paddingBottom: 32,
  },

  // Podium
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 24,
    paddingTop: 8,
  },
  podiumItem: {
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    width: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  podiumFirst: {
    transform: [{ scale: 1.1 }],
    shadowColor: "#fbbf24",
    shadowOpacity: 0.3,
  },
  podiumRank: {
    fontSize: 32,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  podiumHours: {
    fontSize: 13,
    fontWeight: "700",
  },

  // List Section
  listSection: {
    gap: 10,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listItemRank: {
    fontSize: 18,
    fontWeight: "800",
    width: 28,
  },
  listItemInfo: {
    gap: 2,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  listItemMeta: {
    fontSize: 12,
    fontWeight: "500",
  },
  listItemRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  listItemHours: {
    fontSize: 16,
    fontWeight: "800",
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reactionIcon: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "800",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
});
