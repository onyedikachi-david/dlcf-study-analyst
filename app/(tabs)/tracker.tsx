import { useWeekStore } from "@/src/stores";
import { Colors, USRLabels } from "@/src/theme/colors";
import type { DayName, Session } from "@/src/types";
import { DAYS } from "@/src/utils/constants";
import {
  durationMinutes,
  minutesToHrs,
  getCurrentDayIndex,
} from "@/src/utils/time";
import { StudySessionsSyncService } from "@/src/services/studySessionsSync";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { useAuth } from "@/src/contexts/AuthContext";
import React, { memo, useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SessionInputProps {
  label: string;
  session: Session;
}

const SessionInput = memo(function SessionInput({
  label,
  session,
}: SessionInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const duration = durationMinutes(session.start, session.stop);
  const isCompleted = duration > 0;

  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionLeft}>
        <View
          style={[
            styles.sessionIndicator,
            { backgroundColor: isCompleted ? colors.success : colors.surface },
          ]}
        >
          <Text style={styles.sessionIndicatorText}>
            {isCompleted ? "✓" : "○"}
          </Text>
        </View>
        <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>

      <View style={styles.sessionRight}>
        <View
          style={[
            styles.timeBtn,
            { backgroundColor: colors.background },
            session.start && { borderColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.timeText,
              { color: session.start ? colors.text : colors.textSecondary },
            ]}
          >
            {session.start || "—:—"}
          </Text>
        </View>

        <Text style={[styles.timeArrow, { color: colors.textSecondary }]}>
          →
        </Text>

        <View
          style={[
            styles.timeBtn,
            { backgroundColor: colors.background },
            session.stop && { borderColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.timeText,
              { color: session.stop ? colors.text : colors.textSecondary },
            ]}
          >
            {session.stop || "—:—"}
          </Text>
        </View>

        {duration > 0 ? (
          <View
            style={[
              styles.durationBadge,
              { backgroundColor: colors.success + "20" },
            ]}
          >
            <Text style={[styles.durationText, { color: colors.success }]}>
              {minutesToHrs(duration)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

interface DayCardProps {
  day: DayName;
  dayIndex: number;
  currentDayIndex: number;
  onSync: () => void;
  onStartPomodoro: () => void;
}

const DayCard = memo(function DayCard({
  day,
  dayIndex,
  currentDayIndex,
  onSync,
  onStartPomodoro,
}: DayCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { week, updateDayField } = useWeekStore();
  const dayEntry = week[dayIndex];

  const [isExpanded, setIsExpanded] = useState(dayIndex === 0);
  const height = useSharedValue(dayIndex === 0 ? 1 : 0);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      height.set(withTiming(prev ? 0 : 1, { duration: 250 }));
      return !prev;
    });
  }, [height]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: height.get(),
    maxHeight: height.get() * 400,
    overflow: "hidden",
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
        styles.dayCard,
        { backgroundColor: colors.surface },
        hasData && styles.dayCardActive,
      ]}
    >
      <Pressable onPress={toggleExpand} style={styles.dayHeader}>
        <View style={styles.dayHeaderLeft}>
          <Text style={styles.dayEmoji}>{getDayEmoji()}</Text>
          <View>
            <Text style={[styles.dayName, { color: colors.text }]}>
              {day} {isCurrentDay ? "📍" : isPastDay ? "✓" : ""}
            </Text>
            {hasData && (
              <Text
                style={[styles.daySummary, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {dayEntry.topics
                  ? dayEntry.topics.split(",")[0]
                  : `${minutesToHrs(dayTotal)} studied`}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.dayHeaderRight}>
          {dayTotal > 0 && (
            <View
              style={[
                styles.dayTotalBadge,
                {
                  backgroundColor: isGoodDay ? colors.success : colors.primary,
                },
              ]}
            >
              <Text style={styles.dayTotalText}>{minutesToHrs(dayTotal)}</Text>
            </View>
          )}
          <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
            {isExpanded ? "▼" : "▶"}
          </Text>
        </View>
      </Pressable>

      <Animated.View style={animatedStyle}>
        <View style={styles.dayContent}>
          {/* Sessions Section */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              ⏱️ Study Sessions
            </Text>
            <View style={styles.sessionsContainer}>
              {isCurrentDay && dayTotal === 0 ? (
                <Pressable
                  onPress={onStartPomodoro}
                  style={[
                    styles.startPomodoroBtn,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.startPomodoroBtnText}>
                    🍅 Start Pomodoro to Log Time
                  </Text>
                </Pressable>
              ) : isCurrentDay ? (
                <Pressable
                  onPress={onStartPomodoro}
                  style={[
                    styles.startPomodoroSmallBtn,
                    {
                      backgroundColor: colors.primary + "15",
                      borderColor: colors.primary + "40",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.startPomodoroSmallText,
                      { color: colors.primary },
                    ]}
                  >
                    🍅 Continue Studying
                  </Text>
                </Pressable>
              ) : null}
              {!isCurrentDay && dayTotal === 0 ? (
                <View
                  style={[
                    styles.lockedBanner,
                    {
                      backgroundColor: colors.primary + "15",
                      borderColor: colors.primary + "30",
                    },
                  ]}
                >
                  <Text style={[styles.lockedText, { color: colors.primary }]}>
                    {isPastDay
                      ? "📋 No sessions recorded"
                      : "🔒 Future day — will unlock automatically"}
                  </Text>
                </View>
              ) : null}
              <SessionInput label="Session 1" session={dayEntry.st1} />
              <SessionInput label="Session 2" session={dayEntry.st2} />
              <SessionInput label="Session 3" session={dayEntry.st3} />
            </View>
          </View>

          {/* USR Rating */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              📊 Self Rating (1-10)
            </Text>
            <View style={styles.usrRow}>
              <View style={styles.usrStepper}>
                <Pressable
                  onPress={() => {
                    if (dayEntry.usr > 0)
                      updateDayField(day, "usr", dayEntry.usr - 1);
                  }}
                  disabled={!isCurrentDay}
                  style={[
                    styles.usrBtn,
                    { backgroundColor: colors.background },
                    !isCurrentDay && { opacity: 0.5 },
                  ]}
                >
                  <Text style={[styles.usrBtnText, { color: colors.text }]}>
                    −
                  </Text>
                </Pressable>

                <View
                  style={[
                    styles.usrValueContainer,
                    { backgroundColor: usrLabel.color + "20" },
                  ]}
                >
                  <Text style={[styles.usrValue, { color: usrLabel.color }]}>
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
                    styles.usrBtn,
                    { backgroundColor: colors.background },
                    !isCurrentDay && { opacity: 0.5 },
                  ]}
                >
                  <Text style={[styles.usrBtnText, { color: colors.text }]}>
                    +
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.usrLabel, { color: usrLabel.color }]}>
                {usrLabel.label}
              </Text>
            </View>
          </View>

          {/* Topics */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              📚 Topics Studied
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text },
                !isCurrentDay && { opacity: 0.5 },
              ]}
              placeholder="e.g., Stoichiometry, Redox reactions"
              placeholderTextColor={colors.textSecondary}
              value={dayEntry.topics}
              onChangeText={(text) => updateDayField(day, "topics", text)}
              editable={isCurrentDay}
            />
          </View>

          {/* Efficiency */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              💭 How was your focus?
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
                { backgroundColor: colors.surface, color: colors.text },
                !isCurrentDay && { opacity: 0.5 },
              ]}
              value={dayEntry.efficiency}
              onChangeText={(text) => updateDayField(day, "efficiency", text)}
              placeholder="Rate your productivity today..."
              placeholderTextColor={colors.textSecondary}
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

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const { user } = useAuth();
  const { week } = useWeekStore();
  const currentDayIndex = getCurrentDayIndex();
  const [showPomodoro, setShowPomodoro] = useState(false);

  const weekTotal = week.reduce((sum, d) => {
    return (
      sum +
      durationMinutes(d.st1.start, d.st1.stop) +
      durationMinutes(d.st2.start, d.st2.stop) +
      durationMinutes(d.st3.start, d.st3.stop)
    );
  }, 0);

  const studiedDays = week.filter((d) => {
    const total =
      durationMinutes(d.st1.start, d.st1.stop) +
      durationMinutes(d.st2.start, d.st2.stop) +
      durationMinutes(d.st3.start, d.st3.stop);
    return total > 0;
  }).length;

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>
              📊 Study Tracker
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Log your daily grind
            </Text>
          </View>
          <View style={styles.weekStats}>
            <Text style={[styles.weekStatValue, { color: colors.text }]}>
              {minutesToHrs(weekTotal)}
            </Text>
            <Text
              style={[styles.weekStatLabel, { color: colors.textSecondary }]}
            >
              {studiedDays}/7 days
            </Text>
          </View>
        </View>

        {/* Week Progress Bar */}
        <View style={styles.weekProgressContainer}>
          <View
            style={[
              styles.weekProgressBar,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.weekProgressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(studiedDays / 7) * 100}%`,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.weekProgressText, { color: colors.textSecondary }]}
          >
            {studiedDays === 7
              ? "🔥 Perfect week!"
              : `${7 - studiedDays} days remaining`}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {DAYS.map((day, index) => (
          <DayCard
            key={day}
            day={day}
            dayIndex={index}
            currentDayIndex={currentDayIndex}
            onSync={() => handleSyncDay(index)}
            onStartPomodoro={() => setShowPomodoro(true)}
          />
        ))}
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

  // Header
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
  brand: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  weekStats: {
    alignItems: "flex-end",
  },
  weekStatValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  weekStatLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  weekProgressContainer: {
    gap: 8,
  },
  weekProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  weekProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  weekProgressText: {
    fontSize: 12,
    fontWeight: "600",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },

  // Day Card
  dayCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  dayCardActive: {
    shadowOpacity: 0.1,
    elevation: 6,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayEmoji: {
    fontSize: 28,
  },
  dayName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  daySummary: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  dayHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayTotalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dayTotalText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  expandIcon: {
    fontSize: 14,
  },

  dayContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 20,
  },

  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Sessions
  sessionsContainer: {
    gap: 10,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sessionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionIndicatorText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  sessionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    minWidth: 70,
    alignItems: "center",
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  timeArrow: {
    fontSize: 12,
    fontWeight: "600",
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // USR Rating
  usrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  usrStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  usrBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  usrBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  usrValueContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  usrValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  usrLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Text Inputs
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    fontSize: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  lockedBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  startPomodoroBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  startPomodoroBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  startPomodoroSmallBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  startPomodoroSmallText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
