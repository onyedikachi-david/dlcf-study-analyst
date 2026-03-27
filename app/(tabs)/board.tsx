import {
  useLeaderboardStore,
  useProfileStore,
  useWeekStore,
  useAppStore,
} from "@/src/stores";

import type { Reaction } from "@/src/types";
import type { ReactionColumn } from "@/src/types/database";
import { minutesToHrs, durationMinutes } from "@/src/utils/time";
import {
  computeStreak,
  computeWeekTotals,
  computeLevel,
} from "@/src/utils/badges";
import { LeaderboardSyncService } from "@/src/services/leaderboardSync";
import { useAchievementsStore } from "@/src/stores/useAchievementsStore";
import {
  getProgressPercentage,
  getTotalPoints,
  getUnlockedCount,
  type Achievement,
} from "@/src/utils/achievements";
import { useAuth } from "@/src/contexts/AuthContext";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type DimensionValue,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AchievementFilter = "all" | "locked";

export default function BoardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();
  const { entries, react, seedIfNeeded } = useLeaderboardStore();
  const { profile } = useProfileStore();
  const { week } = useWeekStore();
  const { goalMins, cumulativeMinutes, earnedBadges } = useAppStore();
  const { achievements } = useAchievementsStore();
  const [pinning, setPinning] = useState(false);
  const [achievementFilter, setAchievementFilter] =
    useState<AchievementFilter>("all");

  useEffect(() => {
    seedIfNeeded();
  }, [seedIfNeeded]);

  // Computed values
  const totals = computeWeekTotals(week, goalMins);
  const streak = computeStreak(week);
  const { level, xp, levelPct } = computeLevel(
    cumulativeMinutes + totals.total,
  );
  const userRank = entries.findIndex((e) => e.name === profile.name) + 1;
  const totalPoints = getTotalPoints(achievements);
  const unlockedCount = getUnlockedCount(achievements);
  const totalAchievements = achievements.length;

  const totalFocusHours = Math.floor((cumulativeMinutes + totals.total) / 60);
  const completedSessions = useMemo(() => {
    let count = 0;
    week.forEach((day) => {
      if (durationMinutes(day.st1.start, day.st1.stop) > 0) count++;
      if (durationMinutes(day.st2.start, day.st2.stop) > 0) count++;
      if (durationMinutes(day.st3.start, day.st3.stop) > 0) count++;
    });
    return count;
  }, [week]);

  const xpToNext = 300 - xp;
  const topPercent =
    entries.length > 0 && userRank > 0
      ? Math.max(1, Math.round((userRank / entries.length) * 100))
      : 0;

  const filteredAchievements = useMemo(() => {
    const sorted = [...achievements].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      const aProg = getProgressPercentage(a);
      const bProg = getProgressPercentage(b);
      return bProg - aProg;
    });

    if (achievementFilter === "locked") {
      return sorted.filter((a) => !a.unlocked);
    }
    return sorted;
  }, [achievements, achievementFilter]);

  // Show top 4 achievements in grid
  const displayedAchievements = filteredAchievements.slice(0, 4);

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

  // Theme-aware design tokens
  const dt = useMemo(
    () => ({
      bg: isDark ? "#0f0f1a" : "#f6fafe",
      surfaceLow: isDark ? "#1a1a2e" : "#eff4f9",
      surfaceMid: isDark ? "#1e1e32" : "#e8eff4",
      surfaceHigh: isDark ? "#2a2a45" : "#e1e9f0",
      surfaceHighest: isDark ? "#333352" : "#dae4eb",
      surfaceCard: isDark ? "#1e1e32" : "#ffffff",
      primary: isDark ? "#7fb6ff" : "#0060ad",
      primaryContainer: isDark ? "#2a4a7a" : "#9ac3ff",
      onPrimary: isDark ? "#001d3d" : "#f8f8ff",
      secondary: isDark ? "#4ecdc4" : "#146a65",
      secondaryContainer: isDark ? "#1a4a47" : "#a7f3ec",
      onSecondary: isDark ? "#003330" : "#e1fffb",
      tertiary: isDark ? "#eec540" : "#745c00",
      tertiaryContainer: isDark ? "#5a4800" : "#fdd34d",
      onTertiaryContainer: isDark ? "#fdd34d" : "#5c4900",
      text: isDark ? "#f1f5f9" : "#2a3439",
      textSecondary: isDark ? "#94a3b8" : "#576067",
      outline: isDark ? "#64748b" : "#727c82",
      outlineVariant: isDark ? "#475569" : "#a9b3ba",
      error: isDark ? "#f87171" : "#ac3434",
      shadow: isDark ? "rgba(0,0,0,0.4)" : "rgba(42,52,57,0.06)",
    }),
    [isDark],
  );

  return (
    <View style={[styles.container, { backgroundColor: dt.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.headerIcon,
                {
                  backgroundColor: dt.primary,
                },
              ]}
            >
              <Text style={styles.headerIconText}>🏆</Text>
            </View>
            <Text style={[styles.headerTitle, { color: dt.primary }]}>
              FocusFlow
            </Text>
          </View>
          <View style={styles.headerRight}>
            {userRank > 0 && (
              <View
                style={[
                  styles.headerRankPill,
                  { backgroundColor: dt.primaryContainer + "40" },
                ]}
              >
                <Text style={[styles.headerRankText, { color: dt.primary }]}>
                  #{userRank}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.headerAvatar,
                { borderColor: dt.primaryContainer },
              ]}
            >
              <Text style={styles.headerAvatarText}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : "👤"}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Hero Stats Section ─── */}
        <View style={styles.heroSection}>
          {/* Main Hero Card */}
          <View
            style={[
              styles.heroMain,
              {
                backgroundColor: dt.surfaceLow,
                shadowColor: dt.shadow,
              },
            ]}
          >
            <Text style={[styles.heroLabel, { color: dt.primary }]}>
              MASTERY PROGRESS
            </Text>
            <Text style={[styles.heroTitle, { color: dt.text }]}>
              Your Focus Journey{"\n"}is{" "}
              <Text style={{ color: dt.secondary }}>Evolving</Text>
            </Text>

            <View style={styles.heroLevelRow}>
              <Text style={[styles.heroLevelNum, { color: dt.text }]}>
                Level {level}
              </Text>
              <Text style={[styles.heroLevelMax, { color: dt.outline }]}>
                {" "}
                / 20
              </Text>
            </View>

            {/* XP Progress Bar */}
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: dt.surfaceHigh },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${levelPct}%` as DimensionValue,
                    backgroundColor: dt.primary,
                  },
                ]}
              />
            </View>

            <Text style={[styles.heroSubtext, { color: dt.textSecondary }]}>
              {xpToNext} XP to next rank.
              {topPercent > 0
                ? ` You're in the top ${topPercent}% this week!`
                : " Pin your progress to see your ranking!"}
            </Text>

            {/* Decorative glow */}
            <View
              style={[styles.heroGlow, { backgroundColor: dt.primary + "08" }]}
            />
          </View>

          {/* Right Column: Streak + Mini Stats */}
          <View style={styles.heroRight}>
            {/* Streak Card */}
            <View
              style={[
                styles.streakCard,
                { backgroundColor: dt.tertiaryContainer },
              ]}
            >
              <View
                style={[
                  styles.streakIconWrap,
                  { backgroundColor: "rgba(255,255,255,0.3)" },
                ]}
              >
                <Text style={styles.streakIconEmoji}>🔥</Text>
              </View>
              <Text style={[styles.streakLabel, { color: dt.tertiary }]}>
                Focus Streak
              </Text>
              <Text
                style={[styles.streakValue, { color: dt.onTertiaryContainer }]}
              >
                {streak} {streak === 1 ? "Day" : "Days"}
              </Text>
            </View>

            {/* Mini Stats Bento */}
            <View style={styles.miniStatsRow}>
              <View
                style={[
                  styles.miniStatCard,
                  {
                    backgroundColor: dt.surfaceCard,
                    shadowColor: dt.shadow,
                  },
                ]}
              >
                <Text style={[styles.miniStatIcon, { color: dt.secondary }]}>
                  ⏱️
                </Text>
                <Text style={[styles.miniStatValue, { color: dt.text }]}>
                  {totalFocusHours}h
                </Text>
                <Text style={[styles.miniStatLabel, { color: dt.outline }]}>
                  TOTAL FOCUS
                </Text>
              </View>
              <View
                style={[
                  styles.miniStatCard,
                  {
                    backgroundColor: dt.surfaceCard,
                    shadowColor: dt.shadow,
                  },
                ]}
              >
                <Text style={[styles.miniStatIcon, { color: dt.primary }]}>
                  ✅
                </Text>
                <Text style={[styles.miniStatValue, { color: dt.text }]}>
                  {completedSessions}
                </Text>
                <Text style={[styles.miniStatLabel, { color: dt.outline }]}>
                  COMPLETED
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Pin to Board Button ─── */}
        <Pressable
          onPress={handlePinToBoard}
          disabled={pinning}
          style={({ pressed }) => [
            styles.pinButton,
            {
              backgroundColor: dt.primary,
              opacity: pinning ? 0.6 : pressed ? 0.85 : 1,
              shadowColor: dt.primary,
            },
          ]}
        >
          <Text style={[styles.pinButtonText, { color: dt.onPrimary }]}>
            {pinning ? "⏳ Pinning..." : "📌 Pin My Progress to Board"}
          </Text>
        </Pressable>

        {/* ─── Achievements Grid ─── */}
        <View style={styles.achievementsSection}>
          <View style={styles.achievementsHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: dt.text }]}>
                Hall of Fame
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: dt.textSecondary }]}
              >
                Unlock badges by hitting your deep work milestones.
              </Text>
            </View>
            <View style={styles.achievementFilterRow}>
              <Pressable
                onPress={() => setAchievementFilter("all")}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor:
                      achievementFilter === "all"
                        ? dt.secondary
                        : dt.surfaceHigh,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color:
                        achievementFilter === "all"
                          ? dt.onSecondary
                          : dt.textSecondary,
                    },
                  ]}
                >
                  All
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setAchievementFilter("locked")}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor:
                      achievementFilter === "locked"
                        ? dt.secondary
                        : dt.surfaceHigh,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color:
                        achievementFilter === "locked"
                          ? dt.onSecondary
                          : dt.textSecondary,
                    },
                  ]}
                >
                  Locked
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Achievement Cards Grid - 2 columns */}
          <View style={styles.achievementsGrid}>
            {displayedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                dt={dt}
                isDark={isDark}
              />
            ))}
          </View>

          {/* Show all count */}
          {filteredAchievements.length > 4 && (
            <Text style={[styles.showAllHint, { color: dt.textSecondary }]}>
              +{filteredAchievements.length - 4} more achievements — view in
              Profile
            </Text>
          )}
        </View>

        {/* ─── Leaderboard Section ─── */}
        <View style={styles.leaderboardSection}>
          <Text style={[styles.sectionTitle, { color: dt.text }]}>
            Leaderboard
          </Text>
          <Text style={[styles.sectionSubtitle, { color: dt.textSecondary }]}>
            This week&apos;s top performers
          </Text>

          {/* Podium - Top 3 */}
          {entries.length > 0 && (
            <View style={styles.podium}>
              {entries.slice(0, 3).map((entry, index) => (
                <View
                  key={entry.name}
                  style={[
                    styles.podiumItem,
                    {
                      backgroundColor: dt.surfaceCard,
                      shadowColor: dt.shadow,
                    },
                    index === 0 && {
                      transform: [{ scale: 1.05 }],
                      shadowColor: "#fbbf24",
                      shadowOpacity: 0.25,
                    },
                  ]}
                >
                  <Text style={styles.podiumMedal}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </Text>
                  <View
                    style={[
                      styles.podiumAvatarCircle,
                      {
                        backgroundColor:
                          index === 0
                            ? dt.tertiaryContainer
                            : index === 1
                              ? dt.surfaceHigh
                              : dt.primaryContainer + "40",
                      },
                    ]}
                  >
                    <Text style={styles.podiumAvatarText}>
                      {entry.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[styles.podiumName, { color: dt.text }]}
                    numberOfLines={1}
                  >
                    {entry.name.split(" ")[0]}
                  </Text>
                  <Text style={[styles.podiumHours, { color: dt.primary }]}>
                    {minutesToHrs(entry.hours)}
                  </Text>
                  {/* Reactions */}
                  <View style={styles.podiumReactions}>
                    <Pressable
                      onPress={() => handleReact(entry.name, "fire")}
                      style={styles.podiumReactionBtn}
                    >
                      <Text style={styles.podiumReactionEmoji}>🔥</Text>
                      <Text
                        style={[
                          styles.podiumReactionCount,
                          { color: dt.textSecondary },
                        ]}
                      >
                        {entry.reactions.fire}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleReact(entry.name, "cheers")}
                      style={styles.podiumReactionBtn}
                    >
                      <Text style={styles.podiumReactionEmoji}>👏</Text>
                      <Text
                        style={[
                          styles.podiumReactionCount,
                          { color: dt.textSecondary },
                        ]}
                      >
                        {entry.reactions.cheers}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Full List */}
          {entries.length > 0 && (
            <View style={styles.listSection}>
              <Text
                style={[styles.listSectionLabel, { color: dt.textSecondary }]}
              >
                📋 All Students ({entries.length})
              </Text>
              {entries.map((entry, index) => (
                <View
                  key={entry.name}
                  style={[
                    styles.listItem,
                    {
                      backgroundColor: dt.surfaceCard,
                      shadowColor: dt.shadow,
                    },
                  ]}
                >
                  <View style={styles.listItemLeft}>
                    <Text
                      style={[
                        styles.listItemRank,
                        {
                          color: index < 3 ? dt.primary : dt.textSecondary,
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                    <View
                      style={[
                        styles.listItemAvatar,
                        {
                          backgroundColor:
                            index === 0 ? dt.tertiaryContainer : dt.surfaceHigh,
                        },
                      ]}
                    >
                      <Text style={styles.listItemAvatarText}>
                        {entry.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={[styles.listItemName, { color: dt.text }]}>
                        {entry.name}
                      </Text>
                      <Text
                        style={[
                          styles.listItemMeta,
                          { color: dt.textSecondary },
                        ]}
                      >
                        {entry.faculty} • {entry.level}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={[styles.listItemHours, { color: dt.primary }]}>
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
                            { color: dt.textSecondary },
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
                            { color: dt.textSecondary },
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
          )}

          {entries.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📌</Text>
              <Text style={[styles.emptyText, { color: dt.text }]}>
                No students yet!
              </Text>
              <Text style={[styles.emptySubtext, { color: dt.textSecondary }]}>
                Pin your progress to appear on the leaderboard.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Editorial / Why Mastery Section ─── */}
        <View
          style={[styles.editorialCard, { backgroundColor: dt.surfaceHighest }]}
        >
          <Text style={[styles.editorialTitle, { color: dt.text }]}>
            Why Gamify Your Growth?
          </Text>
          <Text style={[styles.editorialBody, { color: dt.textSecondary }]}>
            Our achievement system isn&apos;t just about badges. It&apos;s built
            on neuroscientific principles of variable reward to help you bridge
            the gap between intent and action. Every badge you unlock
            strengthens the neural pathways associated with deep focus.
          </Text>
          <View style={styles.editorialStats}>
            <View style={styles.editorialStatItem}>
              <Text style={[styles.editorialStatValue, { color: dt.primary }]}>
                {totalPoints}
              </Text>
              <Text style={[styles.editorialStatLabel, { color: dt.outline }]}>
                Points Earned
              </Text>
            </View>
            <View
              style={[
                styles.editorialDivider,
                { backgroundColor: dt.outlineVariant + "40" },
              ]}
            />
            <View style={styles.editorialStatItem}>
              <Text
                style={[styles.editorialStatValue, { color: dt.secondary }]}
              >
                {unlockedCount}/{totalAchievements}
              </Text>
              <Text style={[styles.editorialStatLabel, { color: dt.outline }]}>
                Unlocked
              </Text>
            </View>
            <View
              style={[
                styles.editorialDivider,
                { backgroundColor: dt.outlineVariant + "40" },
              ]}
            />
            <View style={styles.editorialStatItem}>
              <Text style={[styles.editorialStatValue, { color: dt.tertiary }]}>
                {earnedBadges.length}
              </Text>
              <Text style={[styles.editorialStatLabel, { color: dt.outline }]}>
                Badges
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

/* ─── Achievement Card Component ─── */

interface AchievementCardProps {
  achievement: Achievement;
  dt: Record<string, string>;
  isDark: boolean;
}

function AchievementCard({ achievement, dt, isDark }: AchievementCardProps) {
  const progress = getProgressPercentage(achievement);
  const isUnlocked = achievement.unlocked;
  // Pick gradient-like colors based on category
  const getCategoryColors = () => {
    switch (achievement.category) {
      case "study":
        return { from: dt.primary, to: dt.primaryContainer };
      case "streak":
        return { from: dt.tertiary, to: dt.tertiaryContainer };
      case "social":
        return { from: dt.secondary, to: dt.secondaryContainer };
      case "master":
        return { from: "#8b5cf6", to: "#c4b5fd" };
      case "special":
        return { from: dt.error, to: "#fca5a5" };
      default:
        return { from: dt.primary, to: dt.primaryContainer };
    }
  };

  const categoryColors = getCategoryColors();

  return (
    <View
      style={[
        styles.achievementCard,
        {
          backgroundColor: isUnlocked ? dt.surfaceCard : dt.surfaceLow,
          shadowColor: dt.shadow,
          opacity: isUnlocked ? 1 : 0.65,
        },
      ]}
    >
      {/* Badge Circle */}
      <View style={styles.achievementBadgeWrap}>
        {isUnlocked ? (
          <View
            style={[
              styles.achievementBadgeCircle,
              { backgroundColor: categoryColors.from },
            ]}
          >
            <Text style={styles.achievementBadgeIcon}>{achievement.icon}</Text>
          </View>
        ) : progress > 0 ? (
          <View style={styles.achievementBadgeCircleOuter}>
            <View
              style={[
                styles.achievementBadgeCircleInner,
                { backgroundColor: dt.surfaceHigh },
              ]}
            >
              <Text style={styles.achievementBadgeIcon}>
                {achievement.icon}
              </Text>
            </View>
            {/* Progress ring approximation */}
            <View
              style={[
                styles.progressRingBg,
                { borderColor: dt.primaryContainer + "30" },
              ]}
            />
            <View
              style={[
                styles.progressRingFill,
                {
                  borderColor: dt.primary,
                  borderTopColor: progress >= 25 ? dt.primary : "transparent",
                  borderRightColor: progress >= 50 ? dt.primary : "transparent",
                  borderBottomColor:
                    progress >= 75 ? dt.primary : "transparent",
                  borderLeftColor: progress >= 100 ? dt.primary : "transparent",
                },
              ]}
            />
          </View>
        ) : (
          <View
            style={[
              styles.achievementBadgeLocked,
              { borderColor: dt.outlineVariant },
            ]}
          >
            <Text style={styles.achievementLockedIcon}>🔒</Text>
          </View>
        )}
      </View>

      {/* Title & Description */}
      <Text
        style={[styles.achievementCardTitle, { color: dt.text }]}
        numberOfLines={1}
      >
        {achievement.title}
      </Text>
      <Text
        style={[styles.achievementCardDesc, { color: dt.textSecondary }]}
        numberOfLines={2}
      >
        {achievement.description}
      </Text>

      {/* Status Label */}
      {isUnlocked ? (
        <View
          style={[
            styles.achievementStatusPill,
            { backgroundColor: categoryColors.from + "15" },
          ]}
        >
          <Text
            style={[
              styles.achievementStatusText,
              { color: categoryColors.from },
            ]}
          >
            UNLOCKED
          </Text>
        </View>
      ) : progress > 0 ? (
        <Text style={[styles.achievementProgressText, { color: dt.primary }]}>
          {Math.round(progress)}% Complete
        </Text>
      ) : (
        <View
          style={[
            styles.achievementStatusPill,
            { backgroundColor: dt.outlineVariant + "15" },
          ]}
        >
          <Text
            style={[styles.achievementStatusText, { color: dt.outlineVariant }]}
          >
            LOCKED
          </Text>
        </View>
      )}
    </View>
  );
}

/* ─── Styles (split into multiple StyleSheet.create calls for TS inference) ─── */

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerRankPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerRankText: {
    fontSize: 13,
    fontWeight: "800",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(154, 195, 255, 0.15)",
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
});

const heroStyles = StyleSheet.create({
  heroSection: {
    gap: 16,
    marginBottom: 20,
  },
  heroMain: {
    borderRadius: 20,
    padding: 28,
    overflow: "hidden",
    position: "relative",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  heroLevelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
  },
  heroLevelNum: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
  },
  heroLevelMax: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  progressBarBg: {
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 7,
  },
  heroSubtext: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  heroGlow: {
    position: "absolute",
    right: -40,
    bottom: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  heroRight: {
    gap: 16,
  },
  streakCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  streakIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  streakIconEmoji: {
    fontSize: 32,
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  miniStatsRow: {
    flexDirection: "row",
    gap: 16,
  },
  miniStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  miniStatIcon: {
    fontSize: 20,
    marginBottom: 10,
  },
  miniStatValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  miniStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  pinButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: "center",
    marginBottom: 32,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  pinButtonText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

const achievementStyles = StyleSheet.create({
  achievementsSection: {
    marginBottom: 32,
  },
  achievementsHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
    lineHeight: 20,
  },
  achievementFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  achievementCard: {
    width: "47%",
    flexGrow: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  achievementBadgeWrap: {
    marginBottom: 14,
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  achievementBadgeCircleOuter: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  achievementBadgeCircleInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  progressRingBg: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
  },
  progressRingFill: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
  },
  achievementBadgeLocked: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  achievementBadgeIcon: {
    fontSize: 32,
  },
  achievementLockedIcon: {
    fontSize: 28,
  },
  achievementCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  achievementCardDesc: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 12,
  },
  achievementStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementStatusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  achievementProgressText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  showAllHint: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
});

const boardStyles = StyleSheet.create({
  leaderboardSection: {
    marginBottom: 32,
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  podiumItem: {
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    width: 105,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  podiumMedal: {
    fontSize: 28,
    marginBottom: 6,
  },
  podiumAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  podiumAvatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  podiumName: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  podiumHours: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  podiumReactions: {
    flexDirection: "row",
    gap: 8,
  },
  podiumReactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  podiumReactionEmoji: {
    fontSize: 12,
  },
  podiumReactionCount: {
    fontSize: 10,
    fontWeight: "600",
  },
  listSection: {
    gap: 10,
  },
  listSectionLabel: {
    fontSize: 12,
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
    padding: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  listItemRank: {
    fontSize: 16,
    fontWeight: "800",
    width: 26,
    textAlign: "center",
  },
  listItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  listItemAvatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  listItemInfo: {
    gap: 2,
    flex: 1,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  listItemMeta: {
    fontSize: 11,
    fontWeight: "500",
  },
  listItemRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  listItemHours: {
    fontSize: 15,
    fontWeight: "800",
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  reactionIcon: {
    fontSize: 13,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 14,
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
  editorialCard: {
    borderRadius: 20,
    padding: 28,
    marginBottom: 8,
  },
  editorialTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  editorialBody: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24,
    marginBottom: 24,
  },
  editorialStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  editorialStatItem: {
    flex: 1,
    alignItems: "center",
  },
  editorialStatValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  editorialStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 4,
  },
  editorialDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 4,
  },
});

const styles = {
  ...baseStyles,
  ...heroStyles,
  ...achievementStyles,
  ...boardStyles,
};
