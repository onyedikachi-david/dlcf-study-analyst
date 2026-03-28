import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import CustomAlert, { type AlertButton } from "@/components/CustomAlert";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";
import { useToast } from "@/components/Toast";
import { useSyncStatus } from "@/src/hooks/useSyncStatus";
import {
  useAppStore,
  useLeaderboardStore,
  useProfileStore,
  useWeekStore,
} from "@/src/stores";
import { useAchievementsStore } from "@/src/stores/useAchievementsStore";
import {
  computeBadges,
  computeLevel,
  computeStreak,
  computeWeekTotals,
} from "@/src/utils/badges";
import { extractMostStudiedCourse } from "@/src/utils/courseParser";
import { durationMinutes, minutesToHrs } from "@/src/utils/time";
import { getTotalPoints, getUnlockedCount } from "@/src/utils/achievements";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  type DimensionValue,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS TYPE
   ═══════════════════════════════════════════════════ */

interface DesignTokens {
  bg: string;
  surfaceLow: string;
  surfaceMid: string;
  surfaceHigh: string;
  surfaceHighest: string;
  surfaceCard: string;
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  tertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  text: string;
  textSecondary: string;
  outline: string;
  outlineVariant: string;
  error: string;
  shadow: string;
}

/* ═══════════════════════════════════════════════════
   STYLES — Declared before components
   ═══════════════════════════════════════════════════ */

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  levelBubble: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBubbleText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  brandText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});

const heroStyles = StyleSheet.create({
  /* Daily Progress Card */
  progressCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },
  progressCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  progressCardTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 20,
    maxWidth: 260,
  },
  progressBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  progressBarLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressBarValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  progressBg: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressActions: {
    flexDirection: "row",
    gap: 12,
  },
  resumeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  resumeBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  progressGlow: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },

  /* Bento Row: Streak + XP */
  bentoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  streakCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
  },
  streakLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  streakUnit: {
    fontSize: 16,
    fontWeight: "700",
  },
  streakIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  streakIcon: {
    fontSize: 26,
  },
  xpCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  xpLevel: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  xpPoints: {
    fontSize: 12,
    fontWeight: "700",
  },
  xpBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  xpHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  xpHintText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

const toolStyles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
  },
  toolsRow: {
    flexDirection: "row",
    gap: 12,
  },
  toolCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  toolName: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  toolDesc: {
    fontSize: 11,
    fontWeight: "500",
  },
});

const sessionStyles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  listContainer: {
    borderRadius: 20,
    overflow: "hidden",
    gap: 2,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  sessionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  sessionIconEmoji: {
    fontSize: 24,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  sessionSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  sessionMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  sessionTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sessionTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sessionTime: {
    fontSize: 11,
    fontWeight: "600",
  },
  sessionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  sessionBtnText: {
    fontSize: 14,
  },
});

const goalStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  input: {
    width: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    borderWidth: 2,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: "center",
  },
  statChipValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statChipLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 1,
  },
});

const profileStyles = StyleSheet.create({
  setupCard: {
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },

  setupTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  setupSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  setupBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  setupBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  greetCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greetLeft: {
    flex: 1,
  },
  greetTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  greetSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  greetEmoji: {
    fontSize: 36,
    marginLeft: 12,
  },
});

/* ═══════════════════════════════════════════════════
   MAIN SCREEN
   ═══════════════════════════════════════════════════ */

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
  const { achievements } = useAchievementsStore();

  // Sync status tracking
  const {
    status: syncStatus,
    triggerSync,
    lastEvent,
    clearLastEvent,
  } = useSyncStatus();
  const toast = useToast();

  // Handle sync status toast notifications
  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case "online":
        toast.success(
          "Back Online",
          lastEvent.hasPendingChanges
            ? "Syncing your changes..."
            : "Connected to network",
        );
        break;
      case "offline":
        toast.info("You're Offline", "Changes will sync when you reconnect");
        break;
      case "synced":
        toast.success("Synced", "Your data is safely backed up");
        break;
      case "error":
        toast.error("Sync Failed", "Tap the sync icon to retry");
        break;
    }

    clearLastEvent();
  }, [lastEvent, clearLastEvent, toast]);

  const [showConfetti, setShowConfetti] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [goalInput, setGoalInput] = useState(String(Math.round(goalMins / 60)));
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    icon?: string;
    iconName?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    buttons?: AlertButton[];
  }>({ visible: false, title: "" });

  const dismissAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    seedIfNeeded();
    checkAndResetIfNewWeek();
  }, [seedIfNeeded, checkAndResetIfNewWeek]);

  // Design tokens
  const dt = useMemo(
    () =>
      ({
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
      }) as DesignTokens,
    [isDark],
  );

  // Computed values
  const totals = computeWeekTotals(week, goalMins);
  const streak = computeStreak(week);
  const mostStudied = extractMostStudiedCourse(week);
  const { level, xp, levelPct } = computeLevel(
    cumulativeMinutes + totals.total,
  );

  const goalHit = totals.total >= goalMins && goalMins > 0;
  const goalHrs = goalMins > 0 ? Math.round(goalMins / 60) : 0;
  const goalProgress = goalMins > 0 ? Math.min(totals.total / goalMins, 1) : 0;
  const xpToNext = 300 - xp;

  const unlockedAchievements = getUnlockedCount(achievements);
  void getTotalPoints(achievements); // keep import used; points surfaced via achievements store

  // Today's total
  const todayEntry = week[0];
  const todayTotal = useMemo(() => {
    return (
      durationMinutes(todayEntry.st1.start, todayEntry.st1.stop) +
      durationMinutes(todayEntry.st2.start, todayEntry.st2.stop) +
      durationMinutes(todayEntry.st3.start, todayEntry.st3.stop)
    );
  }, [todayEntry]);

  const studiedDays = totals.perDay.filter((m) => m > 0).length;

  const progressTitle = useMemo(() => {
    if (goalHit) return "Weekly goal crushed!";
    if (totals.progress >= 75) return "Almost there — push through!";
    if (totals.progress >= 50) return "Halfway to your weekly goal!";
    if (totals.progress >= 25) return "Good start — keep the momentum!";
    if (totals.total > 0) return "Every minute counts. Keep going!";
    return "Ready to start your focus journey?";
  }, [totals.progress, totals.total, goalHit]);

  const streakIconName =
    streak >= 7
      ? "diamond-stone"
      : streak >= 5
        ? "lightning-bolt"
        : streak >= 3
          ? "fire"
          : "book-open-variant";

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
      setAlertConfig({
        visible: true,
        title: "Profile Required",
        message: "Please set your name in the Profile tab first.",
        iconName: "account-circle-outline",
        buttons: [{ text: "Got it", style: "default" }],
      });
      return;
    }

    if (totals.total === 0) {
      setAlertConfig({
        visible: true,
        title: "No Sessions Yet",
        message: "Log some study sessions in the Tracker before submitting.",
        iconName: "clipboard-text-outline",
        buttons: [{ text: "Got it", style: "default" }],
      });
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

  const firstName = profile.name ? profile.name.split(" ")[0] : "";

  return (
    <View style={[baseStyles.container, { backgroundColor: dt.bg }]}>
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
          baseStyles.scrollContent,
          { paddingTop: insets.top + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={baseStyles.header}>
          <View style={baseStyles.headerLeft}>
            {/* Avatar */}
            <View style={baseStyles.avatarWrap}>
              <View
                style={[
                  baseStyles.avatar,
                  { backgroundColor: dt.primaryContainer + "60" },
                ]}
              >
                <Text style={[baseStyles.avatarText]}>
                  {firstName ? firstName[0].toUpperCase() : "D"}
                </Text>
              </View>
              <View
                style={[
                  baseStyles.levelBubble,
                  { backgroundColor: dt.tertiary },
                ]}
              >
                <Text style={baseStyles.levelBubbleText}>LV{level}</Text>
              </View>
              {/* Sync Status Indicator */}
              <View style={{ position: "absolute", top: -4, right: -4 }}>
                <SyncStatusIndicator
                  status={syncStatus}
                  onPress={triggerSync}
                  size="small"
                />
              </View>
            </View>

            {/* Brand */}
            <Text style={[baseStyles.brandText, { color: dt.primary }]}>
              FocusFlow
            </Text>
          </View>

          <View style={baseStyles.headerRight}>
            <Pressable
              onPress={() => router.push("/(tabs)/analytics")}
              style={[baseStyles.headerBtn, { backgroundColor: dt.surfaceLow }]}
            >
              <MaterialCommunityIcons
                name="chart-bar"
                size={20}
                color={dt.primary}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Daily Progress Card ── */}
        <View
          style={[
            heroStyles.progressCard,
            { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
          ]}
        >
          {/* Label */}
          <Text style={[heroStyles.progressCardLabel, { color: dt.primary }]}>
            {"Today\u2019s Focus"}
          </Text>

          {/* Title */}
          <Text style={[heroStyles.progressCardTitle, { color: dt.text }]}>
            {progressTitle}
          </Text>

          {/* Progress Bar */}
          <View style={heroStyles.progressBarRow}>
            <Text
              style={[heroStyles.progressBarLabel, { color: dt.textSecondary }]}
            >
              Study Hours
            </Text>
            <Text style={[heroStyles.progressBarValue, { color: dt.primary }]}>
              {minutesToHrs(totals.total)} / {goalHrs}h
            </Text>
          </View>
          <View
            style={[heroStyles.progressBg, { backgroundColor: dt.surfaceLow }]}
          >
            <View
              style={[
                heroStyles.progressFill,
                {
                  width:
                    `${Math.max(goalProgress * 100, 2)}%` as DimensionValue,
                  backgroundColor: goalHit ? dt.secondary : dt.primary,
                },
              ]}
            />
          </View>

          {/* Action Row */}
          <View style={heroStyles.progressActions}>
            <Pressable
              onPress={() => setShowPomodoro(true)}
              style={[
                heroStyles.resumeBtn,
                {
                  backgroundColor: dt.primary,
                  shadowColor: dt.primary,
                },
              ]}
            >
              <Text style={heroStyles.resumeBtnText}>
                {todayTotal > 0 ? "Resume Session" : "Start Session"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={[heroStyles.submitBtn, { backgroundColor: dt.surfaceLow }]}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <MaterialCommunityIcons
                  name="rocket-launch"
                  size={16}
                  color={dt.text}
                />
                <Text style={[heroStyles.submitBtnText, { color: dt.text }]}>
                  Submit
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Decorative glow */}
          <View
            style={[
              heroStyles.progressGlow,
              { backgroundColor: dt.primary + "08" },
            ]}
          />
        </View>

        {/* ── Bento Row: Streak + XP ── */}
        <View style={heroStyles.bentoRow}>
          {/* Streak Card */}
          <View
            style={[
              heroStyles.streakCard,
              { backgroundColor: dt.tertiaryContainer },
            ]}
          >
            <Text
              style={[
                heroStyles.streakLabel,
                { color: dt.onTertiaryContainer },
              ]}
            >
              Active Streak
            </Text>
            <Text
              style={[
                heroStyles.streakValue,
                { color: dt.onTertiaryContainer },
              ]}
            >
              {streak} <Text style={heroStyles.streakUnit}>Days</Text>
            </Text>
            <View style={heroStyles.streakIconWrap}>
              <MaterialCommunityIcons
                name={streakIconName}
                size={26}
                color={dt.onTertiaryContainer}
              />
            </View>
          </View>

          {/* XP Progress Card */}
          <View
            style={[
              heroStyles.xpCard,
              { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            ]}
          >
            <View style={heroStyles.xpRow}>
              <Text style={[heroStyles.xpLevel, { color: dt.text }]}>
                Level {level}
              </Text>
              <Text style={[heroStyles.xpPoints, { color: dt.secondary }]}>
                {xp} / 300 XP
              </Text>
            </View>
            <View
              style={[heroStyles.xpBarBg, { backgroundColor: dt.surfaceHigh }]}
            >
              <View
                style={[
                  heroStyles.xpBarFill,
                  {
                    width: `${levelPct}%` as DimensionValue,
                    backgroundColor: dt.secondary,
                  },
                ]}
              />
            </View>
            <View style={heroStyles.xpHint}>
              <MaterialCommunityIcons
                name="trending-up"
                size={16}
                color={dt.primary}
              />
              <Text
                style={[heroStyles.xpHintText, { color: dt.textSecondary }]}
              >
                {xpToNext} XP to Level {level + 1}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Focus Tools Section ── */}
        <View style={toolStyles.section}>
          <View style={toolStyles.sectionHeader}>
            <Text style={[toolStyles.sectionTitle, { color: dt.text }]}>
              Focus Tools
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/analytics")}>
              <Text style={[toolStyles.seeAllText, { color: dt.primary }]}>
                See all
              </Text>
            </Pressable>
          </View>

          <View style={toolStyles.toolsRow}>
            {/* Pomodoro Timer */}
            <Pressable
              onPress={() => setShowPomodoro(true)}
              style={[
                toolStyles.toolCard,
                { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
              ]}
            >
              <View
                style={[
                  toolStyles.toolIconWrap,
                  { backgroundColor: dt.secondary },
                ]}
              >
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={24}
                  color={dt.primary}
                />
              </View>
              <Text style={[toolStyles.toolName, { color: dt.text }]}>
                Pomodoro
              </Text>
              <Text style={[toolStyles.toolDesc, { color: dt.textSecondary }]}>
                25:00 · Focus Mode
              </Text>
            </Pressable>

            {/* Tracker */}
            <Pressable
              onPress={() => router.push("/(tabs)/tracker")}
              style={[
                toolStyles.toolCard,
                { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
              ]}
            >
              <View
                style={[
                  toolStyles.toolIconWrap,
                  { backgroundColor: dt.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={24}
                  color={dt.secondary}
                />
              </View>
              <Text style={[toolStyles.toolName, { color: dt.text }]}>
                Tracker
              </Text>
              <Text style={[toolStyles.toolDesc, { color: dt.textSecondary }]}>
                {studiedDays}/7 days · This week
              </Text>
            </Pressable>

            {/* Activity Stats */}
            <Pressable
              onPress={() => router.push("/(tabs)/analytics")}
              style={[
                toolStyles.toolCard,
                { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
              ]}
            >
              <View
                style={[
                  toolStyles.toolIconWrap,
                  { backgroundColor: dt.tertiaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={24}
                  color={dt.tertiary}
                />
              </View>
              <Text style={[toolStyles.toolName, { color: dt.text }]}>
                Analytics
              </Text>
              <Text style={[toolStyles.toolDesc, { color: dt.textSecondary }]}>
                {totals.progress}% of goal
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Next Session / Recent Activity ── */}
        <View style={sessionStyles.section}>
          <Text style={[sessionStyles.sectionTitle, { color: dt.text }]}>
            Next Session
          </Text>

          <View
            style={[
              sessionStyles.listContainer,
              { backgroundColor: dt.surfaceLow },
            ]}
          >
            {/* Session 1 — Primary (resume/start today) */}
            <View
              style={[
                sessionStyles.sessionRow,
                { backgroundColor: dt.surfaceCard },
              ]}
            >
              <View
                style={[
                  sessionStyles.sessionIconWrap,
                  { backgroundColor: dt.surfaceLow },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    mostStudied && mostStudied !== "No topics logged"
                      ? "book-open-page-variant"
                      : "bookshelf"
                  }
                  size={20}
                  color={dt.primary}
                />
              </View>
              <View style={sessionStyles.sessionInfo}>
                <Text style={[sessionStyles.sessionTitle, { color: dt.text }]}>
                  {mostStudied && mostStudied !== "No topics logged"
                    ? mostStudied
                    : "Study Session"}
                </Text>
                <Text
                  style={[
                    sessionStyles.sessionSubtitle,
                    { color: dt.textSecondary },
                  ]}
                >
                  {todayTotal > 0
                    ? `${minutesToHrs(todayTotal)} logged today`
                    : "No sessions logged yet"}
                </Text>
              </View>
              <View style={sessionStyles.sessionMeta}>
                <View
                  style={[
                    sessionStyles.sessionTag,
                    { backgroundColor: dt.secondaryContainer },
                  ]}
                >
                  <Text
                    style={[
                      sessionStyles.sessionTagText,
                      { color: dt.secondary },
                    ]}
                  >
                    {goalHit ? "Goal Hit" : "In Progress"}
                  </Text>
                </View>
                <Text
                  style={[
                    sessionStyles.sessionTime,
                    { color: dt.textSecondary },
                  ]}
                >
                  {todayTotal > 0 ? "Today" : "Start now"}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowPomodoro(true)}
                style={[
                  sessionStyles.sessionBtn,
                  { backgroundColor: dt.primaryContainer },
                ]}
              >
                <Ionicons name="play" size={16} color={dt.primary} />
              </Pressable>
            </View>

            {/* Session 2 — Leaderboard CTA */}
            <View
              style={[
                sessionStyles.sessionRow,
                { backgroundColor: dt.surfaceCard + "80" },
              ]}
            >
              <View
                style={[
                  sessionStyles.sessionIconWrap,
                  { backgroundColor: dt.surfaceMid },
                ]}
              >
                <MaterialCommunityIcons
                  name="trophy"
                  size={22}
                  color={dt.tertiary}
                />
              </View>
              <View style={sessionStyles.sessionInfo}>
                <Text style={[sessionStyles.sessionTitle, { color: dt.text }]}>
                  Leaderboard
                </Text>
                <Text
                  style={[
                    sessionStyles.sessionSubtitle,
                    { color: dt.textSecondary },
                  ]}
                >
                  {earnedBadges.length > 0
                    ? `${earnedBadges.length} badges earned`
                    : "Submit to join the board"}
                </Text>
              </View>
              <View style={sessionStyles.sessionMeta}>
                <Text
                  style={[
                    sessionStyles.sessionTime,
                    { color: dt.textSecondary },
                  ]}
                >
                  Board
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/(tabs)/board")}
                style={[
                  sessionStyles.sessionBtn,
                  { backgroundColor: dt.surfaceLow },
                ]}
              >
                <Text style={sessionStyles.sessionBtnText}>🗓️</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Weekly Goal Editor ── */}
        <View
          style={[
            goalStyles.card,
            { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
          ]}
        >
          <View style={goalStyles.header}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <MaterialCommunityIcons
                name="target"
                size={20}
                color={dt.tertiary}
              />
              <Text style={[goalStyles.title, { color: dt.text }]}>
                Weekly Goal
              </Text>
            </View>
          </View>

          <View style={goalStyles.editRow}>
            <TextInput
              style={[
                goalStyles.input,
                {
                  backgroundColor: dt.surfaceLow,
                  color: dt.text,
                  borderColor: dt.primaryContainer,
                },
              ]}
              value={goalInput}
              onChangeText={handleGoalChange}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={[goalStyles.inputUnit, { color: dt.textSecondary }]}>
              hours / week
            </Text>
          </View>

          {/* Stats chips */}
          <View style={goalStyles.statsRow}>
            <View
              style={[
                goalStyles.statChip,
                { backgroundColor: dt.primaryContainer + "40" },
              ]}
            >
              <Text style={[goalStyles.statChipValue, { color: dt.primary }]}>
                {level}
              </Text>
              <Text style={[goalStyles.statChipLabel, { color: dt.primary }]}>
                Level
              </Text>
            </View>
            <View
              style={[
                goalStyles.statChip,
                { backgroundColor: dt.secondaryContainer + "50" },
              ]}
            >
              <Text style={[goalStyles.statChipValue, { color: dt.secondary }]}>
                {earnedBadges.length}
              </Text>
              <Text style={[goalStyles.statChipLabel, { color: dt.secondary }]}>
                Badges
              </Text>
            </View>
            <View
              style={[
                goalStyles.statChip,
                { backgroundColor: dt.tertiaryContainer + "60" },
              ]}
            >
              <Text style={[goalStyles.statChipValue, { color: dt.tertiary }]}>
                {unlockedAchievements}
              </Text>
              <Text style={[goalStyles.statChipLabel, { color: dt.tertiary }]}>
                Achieve
              </Text>
            </View>
            <View
              style={[goalStyles.statChip, { backgroundColor: dt.surfaceLow }]}
            >
              <Text style={[goalStyles.statChipValue, { color: dt.text }]}>
                {streak}
              </Text>
              <Text
                style={[goalStyles.statChipLabel, { color: dt.textSecondary }]}
              >
                Streak
              </Text>
            </View>
          </View>
        </View>

        {/* ── Welcome / Setup CTA ── */}
        {profile.name ? (
          <View
            style={[
              profileStyles.greetCard,
              { backgroundColor: dt.surfaceLow },
            ]}
          >
            <View style={profileStyles.greetLeft}>
              <Text style={[profileStyles.greetTitle, { color: dt.text }]}>
                Hey {firstName}! 👋
              </Text>
              <Text
                style={[
                  profileStyles.greetSubtitle,
                  { color: dt.textSecondary },
                ]}
              >
                {goalHit
                  ? "You crushed today's goal. Incredible!"
                  : streak >= 3
                    ? `${streak}-day streak! Don't break the chain!`
                    : "Ready to crush your study goals today?"}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={
                goalHit
                  ? "trophy"
                  : streak >= 5
                    ? "lightning-bolt"
                    : streak >= 3
                      ? "fire"
                      : "bookshelf"
              }
              size={32}
              color={
                goalHit ? dt.tertiary : streak >= 3 ? dt.tertiary : dt.primary
              }
            />
          </View>
        ) : (
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[
              profileStyles.setupCard,
              { backgroundColor: dt.primaryContainer + "25" },
            ]}
          >
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={32}
              color={dt.primary}
            />
            <Text style={[profileStyles.setupTitle, { color: dt.text }]}>
              Set up your profile
            </Text>
            <Text
              style={[profileStyles.setupSubtitle, { color: dt.textSecondary }]}
            >
              Track your progress and join the{"\n"}DLCF leaderboard
            </Text>
            <View
              style={[profileStyles.setupBtn, { backgroundColor: dt.primary }]}
            >
              <Text style={profileStyles.setupBtnText}>Get Started →</Text>
            </View>
          </Pressable>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>

      <PomodoroTimer
        visible={showPomodoro}
        onClose={() => setShowPomodoro(false)}
      />
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconName={alertConfig.iconName}
        buttons={alertConfig.buttons}
        onDismiss={dismissAlert}
      />
    </View>
  );
}
