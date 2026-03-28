import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWeekStore, useAppStore } from "@/src/stores";
import { USRLabels } from "@/src/theme/colors";
import type { DayName, Session } from "@/src/types";
import { DAYS } from "@/src/utils/constants";
import {
  durationMinutes,
  minutesToHrs,
  getCurrentDayIndex,
} from "@/src/utils/time";
import {
  computeStreak,
  computeWeekTotals,
  computeLevel,
} from "@/src/utils/badges";
import { StudySessionsSyncService } from "@/src/services/studySessionsSync";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { useAuth } from "@/src/contexts/AuthContext";
import React, { memo, useCallback, useMemo, useState } from "react";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
   STYLES — All StyleSheet objects declared before
   component functions to avoid temporal dead zone
   ═══════════════════════════════════════════════════ */

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
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

const heroStyles = StyleSheet.create({
  section: {
    marginBottom: 20,
    gap: 12,
  },
  /* USR Score Card */
  usrCard: {
    borderRadius: 22,
    padding: 22,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },
  usrCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  usrTextCol: {
    flex: 1,
    marginRight: 16,
  },
  usrLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  usrValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 8,
  },
  usrDesc: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  miniChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 80,
  },
  miniBarCol: {
    width: 14,
    height: "100%",
    justifyContent: "flex-end",
  },
  miniBarBg: {
    width: "100%",
    height: "100%",
    borderRadius: 7,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  miniBarFill: {
    width: "100%",
    borderRadius: 7,
  },
  glow: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  /* Bento Row: Streak + Target */
  bentoRow: {
    flexDirection: "row",
    gap: 12,
  },
  streakCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  streakTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  streakIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Target Card */
  targetCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  targetValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  targetBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    marginBottom: 8,
  },
  targetBarFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
  },
  targetHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  targetDecor: {
    position: "absolute",
    right: 12,
    bottom: 8,
    opacity: 0.25,
  },
});

const weekStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  stat: {
    fontSize: 13,
    fontWeight: "700",
  },
  bars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    gap: 6,
    marginBottom: 16,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
  },
  barBg: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 6,
  },
  progressRow: {
    gap: 8,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

const dayListStyles = StyleSheet.create({
  section: {
    gap: 10,
    marginBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
});

const dayStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
  },
  dayNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayName: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  daySummary: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  totalBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: "600",
  },

  /* Content */
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sessionsContainer: {
    gap: 8,
  },

  /* USR */
  usrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  usrStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  usrBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  usrBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  usrValueWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  usrValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  usrLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  /* Inputs */
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: "top",
    lineHeight: 20,
  },

  /* Pomodoro CTAs */
  pomodoroCta: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  pomodoroCtaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  pomodoroCtaSmall: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 1,
  },
  pomodoroCtaSmallText: {
    fontSize: 14,
    fontWeight: "600",
  },

  /* Locked banner */
  lockedBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  lockedText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});

const sessionStyles = StyleSheet.create({
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionIconText: {
    fontSize: 14,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  sessionTime: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  durationPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "700",
  },
  noDataHint: {
    fontSize: 12,
    fontWeight: "500",
  },
});

const insightStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  cardBody: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginBottom: 12,
  },
  cardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cardPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgesRow: {
    flexDirection: "row",
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -4,
  },
});

/* ═══════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ─── Session Input (read-only time display) ─── */
interface SessionInputProps {
  label: string;
  session: Session;
  sessionIndex: number;
  dt: DesignTokens;
}

const SessionInput = memo(function SessionInput({
  label,
  session,
  sessionIndex,
  dt,
}: SessionInputProps) {
  const duration = durationMinutes(session.start, session.stop);
  const isCompleted = duration > 0;

  const iconEmojis = ["📘", "📗", "📙"];

  return (
    <View
      style={[sessionStyles.sessionRow, { backgroundColor: dt.surfaceLow }]}
    >
      <View style={sessionStyles.sessionLeft}>
        <View
          style={[
            sessionStyles.sessionIcon,
            {
              backgroundColor: isCompleted
                ? dt.secondaryContainer
                : dt.surfaceMid,
            },
          ]}
        >
          <Text style={sessionStyles.sessionIconText}>
            {isCompleted ? "✓" : iconEmojis[sessionIndex] || "📘"}
          </Text>
        </View>
        <View>
          <Text style={[sessionStyles.sessionLabel, { color: dt.text }]}>
            {label}
          </Text>
          <Text
            style={[sessionStyles.sessionTime, { color: dt.textSecondary }]}
          >
            {session.start || "—:—"} → {session.stop || "—:—"}
          </Text>
        </View>
      </View>
      {isCompleted ? (
        <View
          style={[
            sessionStyles.durationPill,
            { backgroundColor: dt.secondary + "18" },
          ]}
        >
          <Text style={[sessionStyles.durationText, { color: dt.secondary }]}>
            {minutesToHrs(duration)}
          </Text>
        </View>
      ) : (
        <Text style={[sessionStyles.noDataHint, { color: dt.outlineVariant }]}>
          No data
        </Text>
      )}
    </View>
  );
});

/* ─── Day Card ─── */
interface DayCardProps {
  day: DayName;
  dayIndex: number;
  currentDayIndex: number;
  onSync: () => void;
  onStartPomodoro: () => void;
  dt: DesignTokens;
}

const DayCard = memo(function DayCard({
  day,
  dayIndex,
  currentDayIndex,
  onSync,
  onStartPomodoro,
  dt,
}: DayCardProps) {
  const { week, updateDayField } = useWeekStore();
  const dayEntry = week[dayIndex];

  const [isExpanded, setIsExpanded] = useState(dayIndex === currentDayIndex);
  const height = useSharedValue(dayIndex === currentDayIndex ? 1 : 0);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      height.set(withTiming(prev ? 0 : 1, { duration: 280 }));
      return !prev;
    });
  }, [height]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: height.get(),
    maxHeight: height.get() * 500,
    overflow: "hidden" as const,
  }));

  const dayTotal =
    durationMinutes(dayEntry.st1.start, dayEntry.st1.stop) +
    durationMinutes(dayEntry.st2.start, dayEntry.st2.stop) +
    durationMinutes(dayEntry.st3.start, dayEntry.st3.stop);

  const isGoodDay = dayTotal >= 240;
  const hasData = dayTotal > 0 || dayEntry.topics || dayEntry.efficiency;
  const usrLabel = USRLabels[dayEntry.usr] || USRLabels[0];
  const isCurrentDay = dayIndex === currentDayIndex;
  const isPastDay = dayIndex < currentDayIndex;

  const getDayEmoji = () => {
    if (dayIndex === 0) return "🌅";
    if (dayIndex === 1) return "💪";
    if (dayIndex === 2) return "🐪";
    if (dayIndex === 3) return "🏃";
    if (dayIndex === 4) return "🎉";
    if (dayIndex === 5) return "🌞";
    return "😴";
  };

  return (
    <View
      style={[
        dayStyles.card,
        { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
        isCurrentDay && { borderWidth: 2, borderColor: dt.primaryContainer },
      ]}
    >
      {/* Day Header */}
      <Pressable onPress={toggleExpand} style={dayStyles.header}>
        <View style={dayStyles.headerLeft}>
          <View
            style={[
              dayStyles.emojiWrap,
              {
                backgroundColor: isCurrentDay
                  ? dt.primaryContainer + "40"
                  : dt.surfaceLow,
              },
            ]}
          >
            <Text style={dayStyles.emoji}>{getDayEmoji()}</Text>
          </View>
          <View>
            <View style={dayStyles.dayNameRow}>
              <Text style={[dayStyles.dayName, { color: dt.text }]}>{day}</Text>
              {isCurrentDay && (
                <View
                  style={[
                    dayStyles.currentBadge,
                    { backgroundColor: dt.primary },
                  ]}
                >
                  <Text style={dayStyles.currentBadgeText}>TODAY</Text>
                </View>
              )}
              {isPastDay && hasData && (
                <Text style={{ fontSize: 12, color: dt.secondary }}>✓</Text>
              )}
            </View>
            {hasData && (
              <Text
                style={[dayStyles.daySummary, { color: dt.textSecondary }]}
                numberOfLines={1}
              >
                {dayEntry.topics
                  ? dayEntry.topics.split(",")[0].trim()
                  : `${minutesToHrs(dayTotal)} studied`}
              </Text>
            )}
          </View>
        </View>

        <View style={dayStyles.headerRight}>
          {dayTotal > 0 && (
            <View
              style={[
                dayStyles.totalBadge,
                {
                  backgroundColor: isGoodDay ? dt.secondary : dt.primary,
                },
              ]}
            >
              <Text style={dayStyles.totalBadgeText}>
                {minutesToHrs(dayTotal)}
              </Text>
            </View>
          )}
          <View
            style={[dayStyles.expandBtn, { backgroundColor: dt.surfaceLow }]}
          >
            <Text style={[dayStyles.expandIcon, { color: dt.textSecondary }]}>
              {isExpanded ? "▾" : "▸"}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Expandable Content */}
      <Animated.View style={animatedStyle}>
        <View style={dayStyles.content}>
          {/* Pomodoro CTA */}
          {isCurrentDay && dayTotal === 0 && (
            <Pressable
              onPress={onStartPomodoro}
              style={[dayStyles.pomodoroCta, { backgroundColor: dt.primary }]}
            >
              <Text style={dayStyles.pomodoroCtaText}>
                🍅 Start Pomodoro to Log Time
              </Text>
            </Pressable>
          )}
          {isCurrentDay && dayTotal > 0 && (
            <Pressable
              onPress={onStartPomodoro}
              style={[
                dayStyles.pomodoroCtaSmall,
                {
                  backgroundColor: dt.primary + "12",
                  borderColor: dt.primary + "30",
                },
              ]}
            >
              <Text
                style={[dayStyles.pomodoroCtaSmallText, { color: dt.primary }]}
              >
                🍅 Continue Studying
              </Text>
            </Pressable>
          )}

          {/* Locked / No-data Banner */}
          {!isCurrentDay && dayTotal === 0 && (
            <View
              style={[
                dayStyles.lockedBanner,
                {
                  backgroundColor: dt.surfaceLow,
                  borderColor: dt.outlineVariant + "40",
                },
              ]}
            >
              <Text style={[dayStyles.lockedText, { color: dt.textSecondary }]}>
                {isPastDay
                  ? "📋 No sessions recorded"
                  : "🔒 Future day — will unlock automatically"}
              </Text>
            </View>
          )}

          {/* Sessions */}
          <View style={dayStyles.section}>
            <Text style={[dayStyles.sectionTitle, { color: dt.textSecondary }]}>
              STUDY SESSIONS
            </Text>
            <View style={dayStyles.sessionsContainer}>
              <SessionInput
                label="Session 1"
                session={dayEntry.st1}
                sessionIndex={0}
                dt={dt}
              />
              <SessionInput
                label="Session 2"
                session={dayEntry.st2}
                sessionIndex={1}
                dt={dt}
              />
              <SessionInput
                label="Session 3"
                session={dayEntry.st3}
                sessionIndex={2}
                dt={dt}
              />
            </View>
          </View>

          {/* USR Rating */}
          <View style={dayStyles.section}>
            <Text style={[dayStyles.sectionTitle, { color: dt.textSecondary }]}>
              SELF RATING (1-10)
            </Text>
            <View style={dayStyles.usrRow}>
              <View style={dayStyles.usrStepper}>
                <Pressable
                  onPress={() => {
                    if (dayEntry.usr > 0)
                      updateDayField(day, "usr", dayEntry.usr - 1);
                  }}
                  disabled={!isCurrentDay}
                  style={[
                    dayStyles.usrBtn,
                    { backgroundColor: dt.surfaceLow },
                    !isCurrentDay && { opacity: 0.4 },
                  ]}
                >
                  <Text style={[dayStyles.usrBtnText, { color: dt.text }]}>
                    −
                  </Text>
                </Pressable>

                <View
                  style={[
                    dayStyles.usrValueWrap,
                    { backgroundColor: usrLabel.color + "18" },
                  ]}
                >
                  <Text style={[dayStyles.usrValue, { color: usrLabel.color }]}>
                    {dayEntry.usr}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    if (dayEntry.usr < 10)
                      updateDayField(day, "usr", dayEntry.usr + 1);
                  }}
                  disabled={!isCurrentDay}
                  style={[
                    dayStyles.usrBtn,
                    { backgroundColor: dt.surfaceLow },
                    !isCurrentDay && { opacity: 0.4 },
                  ]}
                >
                  <Text style={[dayStyles.usrBtnText, { color: dt.text }]}>
                    +
                  </Text>
                </Pressable>
              </View>
              <Text style={[dayStyles.usrLabel, { color: usrLabel.color }]}>
                {usrLabel.label}
              </Text>
            </View>
          </View>

          {/* Topics */}
          <View style={dayStyles.section}>
            <Text style={[dayStyles.sectionTitle, { color: dt.textSecondary }]}>
              TOPICS STUDIED
            </Text>
            <TextInput
              style={[
                dayStyles.textInput,
                {
                  backgroundColor: dt.surfaceLow,
                  color: dt.text,
                  borderColor: dt.outlineVariant + "30",
                },
                !isCurrentDay && { opacity: 0.5 },
              ]}
              placeholder="e.g., Stoichiometry, Redox reactions"
              placeholderTextColor={dt.outlineVariant}
              value={dayEntry.topics}
              onChangeText={(text) => updateDayField(day, "topics", text)}
              editable={isCurrentDay}
            />
          </View>

          {/* Efficiency / Focus Reflection */}
          <View style={dayStyles.section}>
            <Text style={[dayStyles.sectionTitle, { color: dt.textSecondary }]}>
              FOCUS REFLECTION
            </Text>
            <TextInput
              style={[
                dayStyles.textInput,
                dayStyles.multilineInput,
                {
                  backgroundColor: dt.surfaceLow,
                  color: dt.text,
                  borderColor: dt.outlineVariant + "30",
                },
                !isCurrentDay && { opacity: 0.5 },
              ]}
              value={dayEntry.efficiency}
              onChangeText={(text) => updateDayField(day, "efficiency", text)}
              placeholder="Rate your productivity today..."
              placeholderTextColor={dt.outlineVariant}
              multiline
              editable={isCurrentDay}
              numberOfLines={3}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

/* ═══════════════════════════════════════════════════
   MAIN SCREEN
   ═══════════════════════════════════════════════════ */

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();
  const { week } = useWeekStore();
  const { cumulativeMinutes, goalMins } = useAppStore();
  const currentDayIndex = getCurrentDayIndex();
  const [showPomodoro, setShowPomodoro] = useState(false);

  // Design tokens (MD3)
  const dt: DesignTokens = useMemo(
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

  // Computed stats
  const weeklyData = useMemo(() => {
    return week.map((d, i) => {
      const total =
        durationMinutes(d.st1.start, d.st1.stop) +
        durationMinutes(d.st2.start, d.st2.stop) +
        durationMinutes(d.st3.start, d.st3.stop);
      return { day: DAYS_SHORT[i], minutes: total };
    });
  }, [week]);

  const weekTotal = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const studiedDays = weeklyData.filter((d) => d.minutes > 0).length;
  const maxDayMinutes = Math.max(...weeklyData.map((d) => d.minutes), 1);

  const streak = computeStreak(week);
  const totals = computeWeekTotals(week, goalMins);
  const { level } = computeLevel(cumulativeMinutes + totals.total);

  // Today's data
  const todayEntry = week[currentDayIndex];
  const todayTotal =
    durationMinutes(todayEntry.st1.start, todayEntry.st1.stop) +
    durationMinutes(todayEntry.st2.start, todayEntry.st2.stop) +
    durationMinutes(todayEntry.st3.start, todayEntry.st3.stop);

  // Goal progress
  const goalProgress = goalMins > 0 ? Math.min(totals.total / goalMins, 1) : 0;
  const goalHrs = goalMins > 0 ? minutesToHrs(goalMins) : "—";

  // USR average
  const usrAvg = useMemo(() => {
    const rated = week.filter((d) => d.usr > 0);
    if (rated.length === 0) return 0;
    return (
      Math.round(
        (rated.reduce((sum, d) => sum + d.usr, 0) / rated.length) * 10,
      ) / 10
    );
  }, [week]);

  // Peak study time insight
  const peakInsight = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    week.forEach((d) => {
      [d.st1, d.st2, d.st3].forEach((sess) => {
        if (sess.start && sess.stop) {
          const hour = parseInt(sess.start.split(":")[0]);
          if (hour < 12) morning++;
          else if (hour < 17) afternoon++;
          else evening++;
        }
      });
    });
    if (morning >= afternoon && morning >= evening && morning > 0)
      return { period: "Morning", emoji: "🌅", time: "Before 12 PM" };
    if (afternoon >= evening && afternoon > 0)
      return { period: "Afternoon", emoji: "☀️", time: "12 PM – 5 PM" };
    if (evening > 0)
      return { period: "Evening", emoji: "🌙", time: "After 5 PM" };
    return null;
  }, [week]);

  // Best day
  const bestDay = useMemo(() => {
    let maxMins = 0;
    let bestIdx = 0;
    weeklyData.forEach((d, i) => {
      if (d.minutes > maxMins) {
        maxMins = d.minutes;
        bestIdx = i;
      }
    });
    return { name: weeklyData[bestIdx].day, minutes: maxMins };
  }, [weeklyData]);

  const handleSyncDay = useCallback(
    async (dayIndex: number) => {
      if (!user?.id) return;
      const dayData = week[dayIndex];
      if (!dayData) return;
      const { error } = await StudySessionsSyncService.syncDaySessions(
        user.id,
        dayData,
      );
      if (error) {
        console.error("Failed to sync session:", error);
      }
    },
    [user, week],
  );

  return (
    <View style={[baseStyles.container, { backgroundColor: dt.bg }]}>
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
            <View
              style={[
                baseStyles.headerIcon,
                { backgroundColor: dt.primaryContainer + "50" },
              ]}
            >
              <MaterialCommunityIcons
                name="chart-bar"
                size={20}
                color={dt.primary}
              />
            </View>
            <Text style={[baseStyles.headerTitle, { color: dt.text }]}>
              Study Tracker
            </Text>
          </View>
          <View
            style={[
              baseStyles.levelBadge,
              { backgroundColor: dt.tertiaryContainer },
            ]}
          >
            <Text
              style={[
                baseStyles.levelBadgeText,
                { color: dt.onTertiaryContainer },
              ]}
            >
              Lv.{level}
            </Text>
          </View>
        </View>

        {/* ── Hero Section: USR Score + Streak + Today's Target ── */}
        <View style={heroStyles.section}>
          {/* USR Score Card */}
          <View
            style={[
              heroStyles.usrCard,
              { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            ]}
          >
            <View style={heroStyles.usrCardInner}>
              <View style={heroStyles.usrTextCol}>
                <Text
                  style={[heroStyles.usrLabel, { color: dt.textSecondary }]}
                >
                  CURRENT STANDING
                </Text>
                <Text style={[heroStyles.usrValue, { color: dt.primary }]}>
                  USR {usrAvg > 0 ? usrAvg.toFixed(1) : "—"}
                </Text>
                <Text style={[heroStyles.usrDesc, { color: dt.textSecondary }]}>
                  {usrAvg >= 8
                    ? "Outstanding self-assessment. Keep pushing!"
                    : usrAvg >= 5
                      ? "Solid self-rating. Room to grow!"
                      : "Rate your sessions to track focus quality."}
                </Text>
              </View>
              {/* Mini bar chart */}
              <View style={heroStyles.miniChart}>
                {weeklyData.map((d, i) => {
                  const pct = maxDayMinutes > 0 ? d.minutes / maxDayMinutes : 0;
                  return (
                    <View key={i} style={heroStyles.miniBarCol}>
                      <View
                        style={[
                          heroStyles.miniBarBg,
                          { backgroundColor: dt.surfaceLow },
                        ]}
                      >
                        <View
                          style={[
                            heroStyles.miniBarFill,
                            {
                              height:
                                `${Math.max(pct * 100, 4)}%` as DimensionValue,
                              backgroundColor:
                                i === currentDayIndex
                                  ? dt.primary
                                  : dt.primaryContainer,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* Decorative glow */}
            <View
              style={[heroStyles.glow, { backgroundColor: dt.primary + "08" }]}
            />
          </View>

          {/* Streak + Target row */}
          <View style={heroStyles.bentoRow}>
            {/* Streak Card */}
            <View
              style={[
                heroStyles.streakCard,
                { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
              ]}
            >
              <View style={heroStyles.streakTop}>
                <View>
                  <Text
                    style={[
                      heroStyles.streakLabel,
                      { color: dt.textSecondary },
                    ]}
                  >
                    SESSION STREAK
                  </Text>
                  <Text style={[heroStyles.streakValue, { color: dt.text }]}>
                    {streak} {streak === 1 ? "Day" : "Days"}
                  </Text>
                </View>
                <View
                  style={[
                    heroStyles.streakIconWrap,
                    { backgroundColor: dt.tertiaryContainer },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="fire"
                    size={32}
                    color={dt.tertiary}
                  />
                </View>
              </View>
            </View>

            {/* Today's Target Card */}
            <View
              style={[heroStyles.targetCard, { backgroundColor: dt.secondary }]}
            >
              <Text
                style={[
                  heroStyles.targetLabel,
                  { color: dt.onSecondary, opacity: 0.8 },
                ]}
              >
                {"Today\u2019s Target"}
              </Text>
              <Text style={[heroStyles.targetValue, { color: dt.onSecondary }]}>
                {goalHrs}
              </Text>
              {/* Progress bar */}
              <View style={heroStyles.targetBarBg}>
                <View
                  style={[
                    heroStyles.targetBarFill,
                    {
                      width: `${Math.min(
                        goalMins > 0 ? (todayTotal / (goalMins / 7)) * 100 : 0,
                        100,
                      )}%` as DimensionValue,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  heroStyles.targetHint,
                  { color: dt.onSecondary, opacity: 0.9 },
                ]}
              >
                {minutesToHrs(todayTotal)} completed
              </Text>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={22}
                color={dt.secondary}
                style={heroStyles.targetDecor}
              />
            </View>
          </View>
        </View>

        {/* ── Week Progress Summary ── */}
        <View
          style={[
            weekStyles.card,
            { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
          ]}
        >
          <View style={weekStyles.header}>
            <Text style={[weekStyles.title, { color: dt.text }]}>
              Weekly Progress
            </Text>
            <Text style={[weekStyles.stat, { color: dt.primary }]}>
              {minutesToHrs(weekTotal)} · {studiedDays}/7 days
            </Text>
          </View>

          {/* Bar Chart */}
          <View style={weekStyles.bars}>
            {weeklyData.map((d, i) => {
              const pct =
                maxDayMinutes > 0
                  ? Math.max((d.minutes / maxDayMinutes) * 100, 4)
                  : 4;
              const isToday = i === currentDayIndex;
              return (
                <View key={i} style={weekStyles.barCol}>
                  <View
                    style={[
                      weekStyles.barBg,
                      { backgroundColor: dt.surfaceLow },
                    ]}
                  >
                    <View
                      style={[
                        weekStyles.barFill,
                        {
                          height: `${pct}%` as DimensionValue,
                          backgroundColor: isToday
                            ? dt.primary
                            : d.minutes > 0
                              ? dt.primaryContainer
                              : "transparent",
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      weekStyles.dayLabel,
                      {
                        color: isToday ? dt.primary : dt.textSecondary,
                        fontWeight: isToday ? "800" : "600",
                      },
                    ]}
                  >
                    {d.day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Overall progress bar */}
          <View style={weekStyles.progressRow}>
            <View
              style={[
                weekStyles.progressBg,
                { backgroundColor: dt.surfaceLow },
              ]}
            >
              <View
                style={[
                  weekStyles.progressFill,
                  {
                    width: `${goalProgress * 100}%` as DimensionValue,
                    backgroundColor: dt.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[weekStyles.progressText, { color: dt.textSecondary }]}
            >
              {studiedDays === 7
                ? "🔥 Perfect week!"
                : `${7 - studiedDays} days remaining`}
            </Text>
          </View>
        </View>

        {/* ── Day Cards Section ── */}
        <View style={dayListStyles.section}>
          <View style={dayListStyles.header}>
            <View>
              <Text style={[dayListStyles.title, { color: dt.text }]}>
                Daily Log
              </Text>
              <Text
                style={[dayListStyles.subtitle, { color: dt.textSecondary }]}
              >
                Tap a day to expand and view details
              </Text>
            </View>
          </View>

          {DAYS.map((day, index) => (
            <DayCard
              key={day}
              day={day}
              dayIndex={index}
              currentDayIndex={currentDayIndex}
              onSync={() => handleSyncDay(index)}
              onStartPomodoro={() => setShowPomodoro(true)}
              dt={dt}
            />
          ))}
        </View>

        {/* ── Insights Grid ── */}
        <View style={insightStyles.grid}>
          {/* Focus Peak Insight */}
          <View
            style={[
              insightStyles.card,
              {
                backgroundColor: dt.surfaceCard,
                shadowColor: dt.shadow,
                borderColor: dt.primaryContainer + "30",
              },
            ]}
          >
            <View style={insightStyles.cardHeader}>
              <MaterialCommunityIcons
                name="trending-up"
                size={20}
                color={dt.primary}
              />
              <Text style={[insightStyles.cardTitle, { color: dt.text }]}>
                Focus Peak
              </Text>
            </View>
            {peakInsight ? (
              <>
                <Text
                  style={[insightStyles.cardBody, { color: dt.textSecondary }]}
                >
                  Your highest concentration is typically during the{" "}
                  <Text style={{ fontWeight: "700", color: dt.primary }}>
                    {peakInsight.period}
                  </Text>{" "}
                  ({peakInsight.time}). Schedule complex tasks here.
                </Text>
                <View
                  style={[
                    insightStyles.cardPill,
                    { backgroundColor: dt.surfaceLow },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{peakInsight.emoji}</Text>
                  <Text
                    style={[
                      insightStyles.cardPillText,
                      { color: dt.textSecondary },
                    ]}
                  >
                    Peak: {peakInsight.period} sessions
                  </Text>
                </View>
              </>
            ) : (
              <Text
                style={[insightStyles.cardBody, { color: dt.textSecondary }]}
              >
                Log more sessions to discover your peak focus hours.
              </Text>
            )}
          </View>

          {/* Best Day Insight */}
          <View
            style={[
              insightStyles.card,
              {
                backgroundColor: dt.surfaceCard,
                shadowColor: dt.shadow,
                borderColor: dt.secondaryContainer + "30",
              },
            ]}
          >
            <View style={insightStyles.cardHeader}>
              <MaterialCommunityIcons
                name="trophy"
                size={20}
                color={dt.tertiary}
              />
              <Text style={[insightStyles.cardTitle, { color: dt.text }]}>
                Best Day
              </Text>
            </View>
            {bestDay.minutes > 0 ? (
              <>
                <Text
                  style={[insightStyles.cardBody, { color: dt.textSecondary }]}
                >
                  Your best day this week was{" "}
                  <Text style={{ fontWeight: "700", color: dt.secondary }}>
                    {bestDay.name}
                  </Text>{" "}
                  with {minutesToHrs(bestDay.minutes)} of deep work. Can you
                  beat it?
                </Text>
                <View style={insightStyles.badgesRow}>
                  <View
                    style={[
                      insightStyles.badge,
                      { backgroundColor: dt.tertiaryContainer },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="star"
                      size={12}
                      color={dt.tertiary}
                    />
                  </View>
                  <View
                    style={[
                      insightStyles.badge,
                      { backgroundColor: dt.primaryContainer },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="timer-outline"
                      size={12}
                      color={dt.primary}
                    />
                  </View>
                  <View
                    style={[
                      insightStyles.badge,
                      { backgroundColor: dt.secondaryContainer },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="school"
                      size={12}
                      color={dt.secondary}
                    />
                  </View>
                </View>
              </>
            ) : (
              <Text
                style={[insightStyles.cardBody, { color: dt.textSecondary }]}
              >
                Start studying to see your best day stats!
              </Text>
            )}
          </View>
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <PomodoroTimer
        visible={showPomodoro}
        onClose={() => setShowPomodoro(false)}
      />
    </View>
  );
}
