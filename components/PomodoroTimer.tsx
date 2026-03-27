import { useTimerStore, useWeekStore } from "@/src/stores";
import { DAYS, POMODORO } from "@/src/utils/constants";
import {
  formatCountdown,
  formatTimeFromMinutes,
  getCurrentDayIndex,
} from "@/src/utils/time";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  AppStateStatus,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  Vibration,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ─────────────────────────────────────────────────────────
   Design Token Interface
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   Component Props
───────────────────────────────────────────────────────── */
interface PomodoroTimerProps {
  visible: boolean;
  onClose: () => void;
}

/* ─────────────────────────────────────────────────────────
   Static StyleSheets  (declared BEFORE the component)
───────────────────────────────────────────────────────── */
const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  /* ── Header ── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  /* ── Shared section accent bar ── */
  accentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  /* ── Shared pill / chip ── */
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 28,
    alignSelf: "flex-start",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  /* ── Shared full-width action button ── */
  actionBtn: {
    width: "100%",
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
  /* ── Text-only link button ── */
  textBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  textBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

const timerStyles = StyleSheet.create({
  /* ── Setup view ── */
  setupScroll: {
    flex: 1,
  },
  setupScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  setupCard: {
    borderRadius: 22,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  subjectInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
    borderWidth: 1.5,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 28,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pomodoroCount: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
  },
  /* ── Timer view ── */
  timerContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sessionChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 28,
    marginBottom: 28,
  },
  sessionChipText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  timerCircleWrap: {
    width: 260,
    height: 260,
    borderRadius: 130,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    borderWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  timerProgressOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.15,
  },
  timerText: {
    fontSize: 60,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
    zIndex: 1,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    zIndex: 1,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
    width: "100%",
    justifyContent: "center",
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    flex: 1,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  controlIcon: {
    fontSize: 18,
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 28,
    marginBottom: 20,
    alignSelf: "center",
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

const promptStyles = StyleSheet.create({
  /* ── Save prompt view ── */
  promptScroll: {
    flex: 1,
  },
  promptScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: "center",
  },
  heroCelebCard: {
    width: "100%",
    borderRadius: 22,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  minutesValue: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  minutesLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  promptActionsWrap: {
    width: "100%",
    gap: 12,
    marginTop: 4,
  },
  outlineBtn: {
    width: "100%",
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

/* Merge all style sheets into one `s` object */
const s = { ...baseStyles, ...timerStyles, ...promptStyles };

/* ─────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────── */
export function PomodoroTimer({ visible, onClose }: PomodoroTimerProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  /* ── Design tokens ── */
  const dt = useMemo<DesignTokens>(
    () => ({
      bg: isDark ? "#0d1117" : "#f8fafc",
      surfaceLow: isDark ? "#161b22" : "#f1f5f9",
      surfaceMid: isDark ? "#1c2128" : "#e8edf2",
      surfaceHigh: isDark ? "#21262d" : "#dde3e9",
      surfaceHighest: isDark ? "#30363d" : "#ced5dc",
      surfaceCard: isDark ? "#161b22" : "#ffffff",
      primary: isDark ? "#7fb6ff" : "#0060ad",
      primaryContainer: isDark ? "#003e7a" : "#d4e7ff",
      onPrimary: isDark ? "#003258" : "#ffffff",
      secondary: isDark ? "#4ecdc4" : "#146a65",
      secondaryContainer: isDark ? "#0d3d3a" : "#cef5f1",
      onSecondary: isDark ? "#00312e" : "#ffffff",
      tertiary: isDark ? "#eec540" : "#745c00",
      tertiaryContainer: isDark ? "#564400" : "#ffeea3",
      onTertiaryContainer: isDark ? "#ffeea3" : "#241a00",
      text: isDark ? "#e6edf3" : "#0d1117",
      textSecondary: isDark ? "#8b949e" : "#57606a",
      outline: isDark ? "#30363d" : "#d0d7de",
      outlineVariant: isDark ? "#21262d" : "#e8edf2",
      error: isDark ? "#f87171" : "#ac3434",
      shadow: isDark ? "rgba(0,0,0,0.4)" : "rgba(42,52,57,0.06)",
    }),
    [isDark],
  );

  /* ── Store ── */
  const {
    session,
    startWork,
    startBreak,
    pause,
    resume,
    stop,
    complete,
    updateElapsed,
    incrementPomodoroCount,
    reset,
  } = useTimerStore();
  const { addTimeToNextAvailableSlot } = useWeekStore();

  /* ── Local state ── */
  const [subject, setSubject] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(
    POMODORO.WORK_MINS * 60,
  );
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  /* ── Refs ── */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number>(0);

  /* ── Animation ── */
  const pulseScale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.get() }],
  }));

  useEffect(() => {
    if (session?.status === "running") {
      pulseScale.set(
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 500 }),
            withTiming(1, { duration: 500 }),
          ),
          -1,
          true,
        ),
      );
    } else {
      pulseScale.set(withTiming(1));
    }
  }, [session?.status, pulseScale]);

  /* ── App-state background handling ── */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (appState.current.match(/active/) && nextState === "background") {
          backgroundTime.current = Date.now();
        } else if (
          appState.current === "background" &&
          nextState === "active"
        ) {
          if (session?.status === "running" && backgroundTime.current > 0) {
            const elapsed = Math.floor(
              (Date.now() - backgroundTime.current) / 1000,
            );
            setSecondsRemaining((prev) => Math.max(0, prev - elapsed));
          }
        }
        appState.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [session?.status]);

  /* ── Countdown interval ── */
  useEffect(() => {
    if (session?.status === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session?.status]);

  /* ── Callbacks ── */
  const handleTimerComplete = useCallback(() => {
    Vibration.vibrate([0, 500, 200, 500]);
    complete();

    if (session?.type === "work") {
      incrementPomodoroCount();
      setShowSavePrompt(true);
    } else {
      setSecondsRemaining(POMODORO.WORK_MINS * 60);
    }
  }, [session?.type, complete, incrementPomodoroCount]);

  const handleStartWork = useCallback(() => {
    if (!subject.trim()) return;
    startWork(subject.trim());
    setSecondsRemaining(POMODORO.WORK_MINS * 60);
  }, [subject, startWork]);

  const handleStartBreak = useCallback(() => {
    startBreak();
    setSecondsRemaining(POMODORO.BREAK_MINS * 60);
    setShowSavePrompt(false);
  }, [startBreak]);

  const handleSkipBreak = useCallback(() => {
    setSecondsRemaining(POMODORO.WORK_MINS * 60);
    startWork(session?.subject || subject);
    setShowSavePrompt(false);
  }, [session?.subject, subject, startWork]);

  const getElapsedMinutes = useCallback(() => {
    if (!session) return 0;
    const totalSeconds = session.durationMins * 60;
    const elapsedSeconds = totalSeconds - secondsRemaining;
    return Math.ceil(elapsedSeconds / 60);
  }, [session, secondsRemaining]);

  const handleSaveAndContinue = useCallback(() => {
    if (session) {
      const elapsedMins = getElapsedMinutes();
      if (elapsedMins > 0) {
        const dayIndex = getCurrentDayIndex();
        const dayName = DAYS[dayIndex];
        const now = new Date();
        const stopMins = now.getHours() * 60 + now.getMinutes();
        const startMins = stopMins - elapsedMins;

        addTimeToNextAvailableSlot(
          dayName,
          formatTimeFromMinutes(Math.max(0, startMins)),
          formatTimeFromMinutes(stopMins),
          session.subject,
        );
      }
    }
    setShowSavePrompt(false);
    setSecondsRemaining(POMODORO.BREAK_MINS * 60);
  }, [session, getElapsedMinutes, addTimeToNextAvailableSlot]);

  const handlePauseResume = useCallback(() => {
    if (session?.status === "running") {
      pause();
    } else if (session?.status === "paused") {
      resume();
    }
  }, [session?.status, pause, resume]);

  const handleStop = useCallback(() => {
    stop();
    setShowSavePrompt(true);
  }, [stop]);

  const handleClose = useCallback(() => {
    reset();
    setSubject("");
    setSecondsRemaining(POMODORO.WORK_MINS * 60);
    setShowSavePrompt(false);
    onClose();
  }, [reset, onClose]);

  /* ── Derived values ── */
  const progress = session
    ? 1 - secondsRemaining / (session.durationMins * 60)
    : 0;

  const isRunning = session?.status === "running";
  const isPaused = session?.status === "paused";
  const isIdle =
    !session ||
    session.status === "completed" ||
    session.status === "cancelled";

  const isBreak = session?.type === "break";
  const timerAccentColor = isBreak ? dt.secondary : dt.primary;
  const timerAccentContainer = isBreak
    ? dt.secondaryContainer
    : dt.primaryContainer;

  /* ── Header title ── */
  const headerTitle = isBreak ? "☕ Break Time" : "📚 Study Session";

  /* ─────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────── */
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={[
          s.container,
          { backgroundColor: dt.bg, paddingTop: insets.top },
        ]}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerTitleWrap}>
            <Text style={[s.title, { color: dt.text }]}>
              {isIdle && !showSavePrompt ? "🎯 Focus" : headerTitle}
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            style={[s.closeBtn, { backgroundColor: dt.surfaceMid }]}
          >
            <Text style={[s.closeBtnText, { color: dt.textSecondary }]}>✕</Text>
          </Pressable>
        </View>

        {/* ══════════════════════════════════════════
            SAVE PROMPT
        ══════════════════════════════════════════ */}
        {showSavePrompt ? (
          <ScrollView
            style={s.promptScroll}
            contentContainerStyle={s.promptScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero celebration card */}
            <View
              style={[
                s.heroCelebCard,
                {
                  backgroundColor: dt.tertiaryContainer,
                  shadowColor: dt.shadow,
                },
              ]}
            >
              <Text style={s.heroEmoji}>🎉</Text>
              <Text style={[s.heroTitle, { color: dt.onTertiaryContainer }]}>
                Pomodoro Complete!
              </Text>
              <Text style={[s.heroSubtitle, { color: dt.textSecondary }]}>
                {session?.subject
                  ? `You studied ${session.subject}`
                  : "Great work"}{" "}
                — keep it up!
              </Text>

              {/* Minutes studied */}
              <Text style={[s.minutesValue, { color: dt.primary }]}>
                {getElapsedMinutes()}
              </Text>
              <Text style={[s.minutesLabel, { color: dt.textSecondary }]}>
                minutes studied
              </Text>
            </View>

            {/* Action buttons */}
            <View style={s.promptActionsWrap}>
              {/* Save & Take Break */}
              <Pressable
                onPress={handleSaveAndContinue}
                style={[s.actionBtn, { backgroundColor: dt.secondary }]}
              >
                <Text style={s.actionBtnText}>Save &amp; Take Break</Text>
              </Pressable>

              {/* Skip Break, Continue Studying */}
              <Pressable
                onPress={handleSkipBreak}
                style={[s.outlineBtn, { borderColor: dt.secondary }]}
              >
                <Text style={[s.outlineBtnText, { color: dt.secondary }]}>
                  Skip Break, Continue Studying
                </Text>
              </Pressable>

              {/* End Session */}
              <Pressable onPress={handleClose} style={s.textBtn}>
                <Text style={[s.textBtnText, { color: dt.textSecondary }]}>
                  End Session
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : /* ══════════════════════════════════════════
            SETUP VIEW  (idle)
        ══════════════════════════════════════════ */
        isIdle ? (
          <ScrollView
            style={s.setupScroll}
            contentContainerStyle={s.setupScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Setup card */}
            <View
              style={[
                s.setupCard,
                {
                  backgroundColor: dt.surfaceCard,
                  shadowColor: dt.shadow,
                },
              ]}
            >
              {/* Section title with accent bar */}
              <View style={s.sectionTitleRow}>
                <View style={[s.accentBar, { backgroundColor: dt.primary }]} />
                <Text style={[s.sectionTitle, { color: dt.text }]}>
                  What are you studying?
                </Text>
              </View>

              {/* Subject input */}
              <TextInput
                style={[
                  s.subjectInput,
                  {
                    backgroundColor: dt.surfaceLow,
                    color: dt.text,
                    borderColor: dt.outline,
                  },
                ]}
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g., CHM101 Stoichiometry"
                placeholderTextColor={dt.textSecondary}
                autoFocus
              />

              {/* Preset chips */}
              <View style={s.presetsRow}>
                {["CHM101", "PHY103", "MTH101", "BIO101"].map((code) => (
                  <Pressable
                    key={code}
                    onPress={() => setSubject(code)}
                    style={[
                      s.presetChip,
                      { backgroundColor: dt.primaryContainer },
                    ]}
                  >
                    <Text style={[s.presetChipText, { color: dt.primary }]}>
                      {code}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Start button */}
              <Pressable
                onPress={handleStartWork}
                disabled={!subject.trim()}
                style={[
                  s.actionBtn,
                  {
                    backgroundColor: subject.trim()
                      ? dt.primary
                      : dt.surfaceHigh,
                    opacity: subject.trim() ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={s.actionBtnText}>
                  🎯 Start {POMODORO.WORK_MINS} min Focus Session
                </Text>
              </Pressable>

              {/* Pomodoro count */}
              {session?.pomodoroCount ? (
                <Text style={[s.pomodoroCount, { color: dt.tertiary }]}>
                  🍅 {session.pomodoroCount} pomodoros completed today
                </Text>
              ) : null}
            </View>
          </ScrollView>
        ) : (
          /* ══════════════════════════════════════════
            TIMER VIEW  (running / paused)
        ══════════════════════════════════════════ */
          <View style={s.timerContainer}>
            {/* Subject chip */}
            <View
              style={[s.subjectChip, { backgroundColor: dt.primaryContainer }]}
            >
              <Text style={[s.subjectChipText, { color: dt.primary }]}>
                {session?.subject}
              </Text>
            </View>

            {/* Session-type chip (Work / Break) */}
            <View
              style={[s.sessionChip, { backgroundColor: timerAccentContainer }]}
            >
              <Text style={[s.sessionChipText, { color: timerAccentColor }]}>
                {isBreak ? "☕ Break" : "🎯 Focus"}
              </Text>
            </View>

            {/* Timer circle */}
            <Animated.View
              style={[
                s.timerCircleWrap,
                pulseStyle,
                {
                  backgroundColor: dt.surfaceCard,
                  borderColor: timerAccentColor,
                  shadowColor: dt.shadow,
                },
              ]}
            >
              {/* Progress fill overlay */}
              <View
                style={[
                  s.timerProgressOverlay,
                  {
                    backgroundColor: timerAccentColor,
                    height: `${progress * 100}%`,
                  },
                ]}
              />

              {/* Time text */}
              <Text style={[s.timerText, { color: dt.text }]}>
                {formatCountdown(secondsRemaining)}
              </Text>

              {/* Focus / Break label */}
              <Text style={[s.timerLabel, { color: dt.textSecondary }]}>
                {isBreak ? "Break" : "Focus"}
              </Text>
            </Animated.View>

            {/* Control buttons */}
            <View style={s.controlsRow}>
              {/* Pause / Resume */}
              <Pressable
                onPress={handlePauseResume}
                style={[
                  s.controlBtn,
                  {
                    backgroundColor: dt.surfaceHigh,
                    shadowColor: dt.shadow,
                  },
                ]}
              >
                <Text style={s.controlIcon}>{isRunning ? "⏸️" : "▶️"}</Text>
                <Text style={[s.controlBtnText, { color: dt.primary }]}>
                  {isRunning ? "Pause" : "Resume"}
                </Text>
              </Pressable>

              {/* Stop */}
              <Pressable
                onPress={handleStop}
                style={[
                  s.controlBtn,
                  {
                    backgroundColor: dt.error,
                    shadowColor: dt.shadow,
                  },
                ]}
              >
                <Text style={s.controlIcon}>⏹️</Text>
                <Text style={[s.controlBtnText, { color: "#ffffff" }]}>
                  Stop
                </Text>
              </Pressable>
            </View>

            {/* Skip break link */}
            {isBreak ? (
              <Pressable onPress={handleSkipBreak} style={s.textBtn}>
                <Text style={[s.textBtnText, { color: dt.primary }]}>
                  Skip Break →
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
}
