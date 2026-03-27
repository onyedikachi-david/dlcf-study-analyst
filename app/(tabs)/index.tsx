import { PomodoroTimer } from "@/components/PomodoroTimer";
import {
  useAppStore,
  useLeaderboardStore,
  useProfileStore,
  useWeekStore,
} from "@/src/stores";
import { Colors } from "@/src/theme/colors";
import {
  computeBadges,
  computeLevel,
  computeStreak,
  computeWeekTotals,
} from "@/src/utils/badges";
import { extractMostStudiedCourse } from "@/src/utils/courseParser";
import { minutesToHrs } from "@/src/utils/time";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { profile } = useProfileStore();
  const { week, checkAndResetIfNewWeek } = useWeekStore();
  const {
    goalMins,
    setGoalMins,
    facts,
    earnedBadges,
    addEarnedBadges,
    cumulativeMinutes,
  } = useAppStore();
  const { upsert, seedIfNeeded } = useLeaderboardStore();

  const [showConfetti, setShowConfetti] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [goalInput, setGoalInput] = useState(String(Math.round(goalMins / 60)));

  useEffect(() => {
    seedIfNeeded();
    checkAndResetIfNewWeek();
  }, [seedIfNeeded, checkAndResetIfNewWeek]);

  const totals = computeWeekTotals(week, goalMins);
  const streak = computeStreak(week);
  const mostStudied = extractMostStudiedCourse(week);
  const { level, xp, levelPct } = computeLevel(
    cumulativeMinutes + totals.total,
  );

  const streakIcon =
    streak >= 7 ? "💎" : streak >= 5 ? "⚡" : streak >= 3 ? "🔥" : "📖";
  const goalHit = totals.total >= goalMins;

  const handleGoalChange = useCallback(
    (text: string) => {
      setGoalInput(text);
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > 0 && num <= 100) {
        setGoalMins(num * 60);
      }
    },
    [setGoalMins],
  );

  const handleSubmit = useCallback(() => {
    if (!profile.name.trim()) {
      Alert.alert(
        "Profile Required",
        "Please set your name in the Profile tab first.",
      );
      return;
    }

    if (totals.total === 0) {
      Alert.alert(
        "No Data",
        "Log some study sessions in the Tracker before submitting.",
      );
      return;
    }

    const badges = computeBadges({
      streak,
      totals,
      week,
      goalMins,
      level,
      factsCount: facts.length,
    });

    addEarnedBadges(badges);

    upsert({
      name: profile.name,
      faculty: profile.faculty,
      department: profile.department,
      level: profile.level,
      hours: totals.total,
      pinnedAt: Date.now(),
      reactions: { cheers: 0, fire: 0, star: 0, heart: 0 },
      badges,
    });

    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      router.push("/(tabs)/board");
    }, 3000);
  }, [
    profile,
    totals,
    streak,
    week,
    goalMins,
    level,
    facts.length,
    addEarnedBadges,
    upsert,
    router,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showConfetti ? (
        <ConfettiCannon
          count={120}
          origin={{ x: 200, y: 0 }}
          fadeOut
          autoStart
        />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>
              📚 DLCF FUL
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Study. Level Up. Repeat.
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={[styles.levelBadgeText, { color: colors.primary }]}>
              LVL {level}
            </Text>
          </View>
        </View>

        {/* Main Progress Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.surface }]}>
          {/* Header Row */}
          <View style={styles.mainCardHeader}>
            <View
              style={[
                styles.streakPill,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={styles.streakPillIcon}>{streakIcon}</Text>
              <Text style={[styles.streakPillText, { color: colors.primary }]}>
                {streak} day streak
              </Text>
            </View>
            <View
              style={[
                styles.goalPill,
                {
                  backgroundColor: goalHit
                    ? colors.success + "20"
                    : colors.warning + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.goalPillText,
                  { color: goalHit ? colors.success : colors.warning },
                ]}
              >
                {goalHit ? "🎯 Goal Hit!" : `${totals.progress}%`}
              </Text>
            </View>
          </View>

          {/* Big Progress Display */}
          <View style={styles.progressSection}>
            <View
              style={[
                styles.progressCircle,
                { borderColor: goalHit ? colors.success : colors.primary },
              ]}
            >
              <View style={styles.progressContent}>
                <Text style={[styles.progressValue, { color: colors.text }]}>
                  {minutesToHrs(totals.total)}
                </Text>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  of {Math.round(goalMins / 60)}h goal
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {level}
              </Text>
              <Text
                style={[styles.quickStatLabel, { color: colors.textSecondary }]}
              >
                Level
              </Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {earnedBadges.length}
              </Text>
              <Text
                style={[styles.quickStatLabel, { color: colors.textSecondary }]}
              >
                Badges
              </Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {mostStudied.split(" ")[0]}
              </Text>
              <Text
                style={[styles.quickStatLabel, { color: colors.textSecondary }]}
              >
                Top Topic
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => setShowPomodoro(true)}
            style={[
              styles.actionBtn,
              styles.pomodoroActionBtn,
              { backgroundColor: colors.success },
            ]}
          >
            <Text style={styles.actionBtnEmoji}>🍅</Text>
            <Text style={styles.actionBtnText}>Start Focus</Text>
            <Text style={styles.actionBtnSubtext}>25 min timer</Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            style={[
              styles.actionBtn,
              styles.submitActionBtn,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.actionBtnEmoji}>🚀</Text>
            <Text style={styles.actionBtnText}>Submit</Text>
            <Text style={styles.actionBtnSubtext}>to leaderboard</Text>
          </Pressable>
        </View>

        {/* Weekly Goal Editor */}
        <View style={[styles.goalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.goalCardTitle, { color: colors.text }]}>
            🎯 Weekly Goal
          </Text>
          <View style={styles.goalEditor}>
            <TextInput
              style={[
                styles.goalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={goalInput}
              onChangeText={handleGoalChange}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={[styles.goalUnit, { color: colors.textSecondary }]}>
              hours / week
            </Text>
          </View>
          <View style={styles.xpBar}>
            <View
              style={[
                styles.xpFill,
                { backgroundColor: colors.primary, width: `${levelPct}%` },
              ]}
            />
          </View>
          <Text style={[styles.xpText, { color: colors.textSecondary }]}>
            {xp}/300 XP to Level {level + 1}
          </Text>
        </View>

        {/* Welcome / CTA */}
        {profile.name ? (
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Hey {profile.name.split(" ")[0]}! 👋
            </Text>
            <Text
              style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}
            >
              Ready to crush your study goals today?
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[
              styles.setupCard,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Text style={styles.setupEmoji}>👋</Text>
            <Text style={[styles.setupTitle, { color: colors.text }]}>
              Set up your profile
            </Text>
            <Text
              style={[styles.setupSubtitle, { color: colors.textSecondary }]}
            >
              Track your progress & join the leaderboard
            </Text>
            <Text style={[styles.setupArrow, { color: colors.primary }]}>
              →
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <PomodoroTimer
        visible={showPomodoro}
        onClose={() => setShowPomodoro(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Top Bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  brand: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(139,92,246,0.15)",
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },

  // Main Card
  mainCard: {
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  mainCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  streakPillIcon: {
    fontSize: 14,
  },
  streakPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  goalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goalPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Progress
  progressSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  progressCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContent: {
    alignItems: "center",
  },
  progressValue: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  progressLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },

  // Quick Stats
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  quickStat: {
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  pomodoroActionBtn: {
    shadowColor: "#10b981",
  },
  submitActionBtn: {
    shadowColor: "#8b5cf6",
  },
  actionBtnEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  actionBtnSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

  // Goal Card
  goalCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  goalEditor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  goalInput: {
    width: 70,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    borderWidth: 2,
  },
  goalUnit: {
    fontSize: 15,
    fontWeight: "600",
  },
  xpBar: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },

  // Welcome Section
  welcomeSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: "500",
  },

  // Setup Card
  setupCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginTop: 10,
  },
  setupEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  setupSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  setupArrow: {
    fontSize: 24,
    fontWeight: "700",
  },
});
