import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTimerStore, useWeekStore } from "@/src/stores";
import { DAYS, POMODORO } from "@/src/utils/constants";
import {
  formatCountdown,
  formatTimeFromMinutes,
  getCurrentDayIndex,
} from "@/src/utils/time";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
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
   Types
───────────────────────────────────────────────────────── */
type TimerMode = "focus" | "short" | "long";

interface PomodoroTimerProps {
  visible: boolean;
  onClose: () => void;
}

/* ─────────────────────────────────────────────────────────
   Static StyleSheets — declared BEFORE component
───────────────────────────────────────────────────────── */
const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accentBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  muteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Mode tabs */
  modeTabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  /* Cycle indicator */
  cycleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  cycleLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  cycleDots: {
    flexDirection: "row",
    gap: 6,
  },
  cycleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cycleLongBreakHint: {
    fontSize: 11,
    fontWeight: "600",
  },
  /* Shared action button */
  actionBtn: {
    width: "100%",
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
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
    fontSize: 15,
    fontWeight: "700",
  },
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
  /* Setup */
  setupScroll: {
    flex: 1,
  },
  setupScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  subjectInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 16,
    borderWidth: 1.5,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pomodoroCount: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
    fontWeight: "600",
  },
  /* Timer view */
  timerContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: "center",
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: "700",
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
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
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    zIndex: 1,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    width: "100%",
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    flex: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },

  controlBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
    alignSelf: "center",
    marginBottom: 8,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

const promptStyles = StyleSheet.create({
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
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  minutesValue: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  minutesLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  /* Cycle summary row inside prompt */
  cycleSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cycleSummaryText: {
    fontSize: 13,
    fontWeight: "700",
  },
  promptActionsWrap: {
    width: "100%",
    gap: 10,
    marginTop: 4,
  },
});

const s = { ...baseStyles, ...timerStyles, ...promptStyles };

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function getDurationForMode(mode: TimerMode): number {
  if (mode === "focus") return POMODORO.WORK_MINS * 60;
  if (mode === "short") return POMODORO.BREAK_MINS * 60;
  return POMODORO.LONG_BREAK_MINS * 60;
}

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
    startLongBreak,
    pause,
    resume,
    stop,
    complete,
    incrementPomodoroCount,
    reset,
  } = useTimerStore();
  const { addTimeToNextAvailableSlot } = useWeekStore();

  /* ── Local state ── */
  const [subject, setSubject] = useState("");
  const [activeMode, setActiveMode] = useState<TimerMode>("focus");
  const [secondsRemaining, setSecondsRemaining] = useState(
    POMODORO.WORK_MINS * 60,
  );
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  /* ── Refs ── */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number>(0);
  const handleTimerCompleteRef = useRef<() => void>(() => {});

  // Audio player for chime sound
  const chimePlayer = useAudioPlayer(require("../assets/chime.wav"));

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
            withTiming(1.04, { duration: 600 }),
            withTiming(1, { duration: 600 }),
          ),
          -1,
          true,
        ),
      );
    } else {
      pulseScale.set(withTiming(1, { duration: 200 }));
    }
  }, [session?.status, pulseScale]);

  /* ── Sound ── */
  // Configure audio mode on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  }, []);

  const playChime = useCallback(async () => {
    // Always vibrate regardless of mute (tactile feedback)
    Vibration.vibrate([0, 120, 80, 120, 80, 200]);
    if (isMuted) return;
    try {
      // Seek to start and play
      chimePlayer.seekTo(0);
      chimePlayer.play();
    } catch {
      // Silently ignore audio errors (e.g. simulator limitations)
    }
  }, [isMuted, chimePlayer]);

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
            handleTimerCompleteRef.current();
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

  /* ── Derived values ── */
  const pomodoroCount = session?.pomodoroCount ?? 0;
  // Which dot in the cycle (0-3) is filled
  const cyclePosition = pomodoroCount % POMODORO.POMODOROS_PER_LONG_BREAK;
  // How many full cycles completed
  const fullCycles = Math.floor(
    pomodoroCount / POMODORO.POMODOROS_PER_LONG_BREAK,
  );
  const pomodosUntilLongBreak =
    POMODORO.POMODOROS_PER_LONG_BREAK - cyclePosition;

  const progress = session
    ? 1 - secondsRemaining / (session.durationMins * 60)
    : 0;

  const isRunning = session?.status === "running";
  const isIdle =
    !session ||
    session.status === "completed" ||
    session.status === "cancelled";

  const isBreak = session?.type === "break";
  const isLongBreak =
    isBreak && session?.durationMins === POMODORO.LONG_BREAK_MINS;

  const timerAccentColor = isBreak
    ? isLongBreak
      ? dt.tertiary
      : dt.secondary
    : dt.primary;

  /* ── Callbacks ── */
  const handleTimerComplete = useCallback(() => {
    playChime();
    complete();

    if (session?.type === "work") {
      incrementPomodoroCount();
      setShowSavePrompt(true);
    } else {
      // Break ended — reset to focus mode idle
      setSecondsRemaining(POMODORO.WORK_MINS * 60);
      setActiveMode("focus");
    }
  }, [session?.type, complete, incrementPomodoroCount, playChime]);

  // Keep the ref always pointing at the latest version of the callback
  // so the setInterval closure (which never re-registers) always calls
  // the up-to-date function with fresh state/props.
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  }, [handleTimerComplete]);

  const handleStartSession = useCallback(() => {
    if (activeMode === "focus") {
      if (!subject.trim()) return;
      startWork(subject.trim());
      setSecondsRemaining(POMODORO.WORK_MINS * 60);
    } else if (activeMode === "short") {
      startBreak();
      setSecondsRemaining(POMODORO.BREAK_MINS * 60);
      setShowSavePrompt(false);
    } else {
      startLongBreak();
      setSecondsRemaining(POMODORO.LONG_BREAK_MINS * 60);
      setShowSavePrompt(false);
    }
  }, [activeMode, subject, startWork, startBreak, startLongBreak]);

  /* Skip: end current phase and advance to the next logical one */
  const handleSkip = useCallback(() => {
    if (session?.type === "work") {
      // Skip focus → go to appropriate break
      complete();
      incrementPomodoroCount();
      const nextCount = (session.pomodoroCount ?? 0) + 1;
      const isNextLong = nextCount % POMODORO.POMODOROS_PER_LONG_BREAK === 0;
      if (isNextLong) {
        startLongBreak();
        setSecondsRemaining(POMODORO.LONG_BREAK_MINS * 60);
        setActiveMode("long");
      } else {
        startBreak();
        setSecondsRemaining(POMODORO.BREAK_MINS * 60);
        setActiveMode("short");
      }
      setShowSavePrompt(false);
    } else {
      // Skip break → go back to focus
      complete();
      setSecondsRemaining(POMODORO.WORK_MINS * 60);
      setActiveMode("focus");
      if (subject.trim()) {
        startWork(subject.trim());
      } else {
        reset();
      }
      setShowSavePrompt(false);
    }
  }, [
    session,
    subject,
    complete,
    incrementPomodoroCount,
    startWork,
    startBreak,
    startLongBreak,
    reset,
  ]);

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

    // After saving, decide: long break or short break?
    const nextCount = pomodoroCount;
    const isNextLong =
      nextCount > 0 && nextCount % POMODORO.POMODOROS_PER_LONG_BREAK === 0;

    if (isNextLong) {
      startLongBreak();
      setSecondsRemaining(POMODORO.LONG_BREAK_MINS * 60);
      setActiveMode("long");
    } else {
      startBreak();
      setSecondsRemaining(POMODORO.BREAK_MINS * 60);
      setActiveMode("short");
    }
    setShowSavePrompt(false);
  }, [
    session,
    pomodoroCount,
    getElapsedMinutes,
    addTimeToNextAvailableSlot,
    startBreak,
    startLongBreak,
  ]);

  const handleSkipBreakFromPrompt = useCallback(() => {
    setSecondsRemaining(POMODORO.WORK_MINS * 60);
    setActiveMode("focus");
    startWork(session?.subject || subject);
    setShowSavePrompt(false);
  }, [session?.subject, subject, startWork]);

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
    setActiveMode("focus");
    setSecondsRemaining(POMODORO.WORK_MINS * 60);
    setShowSavePrompt(false);
    onClose();
  }, [reset, onClose]);

  /* Switch mode from tabs while idle */
  const handleModeTab = useCallback(
    (mode: TimerMode) => {
      if (!isIdle) return; // lock tabs while session active
      setActiveMode(mode);
      setSecondsRemaining(getDurationForMode(mode));
    },
    [isIdle],
  );

  /* ── Mode tab config ── */
  const modeTabs: { key: TimerMode; label: string; mins: number }[] = [
    { key: "focus", label: "Focus", mins: POMODORO.WORK_MINS },
    { key: "short", label: "Short Break", mins: POMODORO.BREAK_MINS },
    { key: "long", label: "Long Break", mins: POMODORO.LONG_BREAK_MINS },
  ];

  /* ── Active accent for current mode/session ── */
  const activeTabAccent =
    activeMode === "focus"
      ? dt.primary
      : activeMode === "short"
        ? dt.secondary
        : dt.tertiary;

  /* Header title */
  const headerTitle = showSavePrompt
    ? "Session Done"
    : isIdle
      ? activeMode === "focus"
        ? "Focus"
        : activeMode === "short"
          ? "Short Break"
          : "Long Break"
      : isBreak
        ? isLongBreak
          ? "Long Break"
          : "Short Break"
        : "Focus";

  /* ─────────────────────────────────────────────────────
     CYCLE INDICATOR
  ───────────────────────────────────────────────────── */
  const CycleIndicator = () => (
    <View style={s.cycleRow}>
      <Text style={[s.cycleLabel, { color: dt.textSecondary }]}>
        Cycle {fullCycles + 1}
      </Text>
      <View style={s.cycleDots}>
        {Array.from({ length: POMODORO.POMODOROS_PER_LONG_BREAK }).map(
          (_, i) => (
            <View
              key={i}
              style={[
                s.cycleDot,
                {
                  backgroundColor:
                    i < cyclePosition
                      ? dt.primary
                      : i === cyclePosition && !isIdle && !isBreak
                        ? dt.primary + "55"
                        : dt.outlineVariant,
                },
              ]}
            />
          ),
        )}
      </View>
      <Text style={[s.cycleLongBreakHint, { color: dt.tertiary }]}>
        {pomodosUntilLongBreak === 1
          ? "🌙 Long break next!"
          : `${pomodosUntilLongBreak} until long break`}
      </Text>
    </View>
  );

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
          <View style={s.headerLeft}>
            <View style={[s.accentBar, { backgroundColor: activeTabAccent }]} />
            <Text style={[s.title, { color: dt.text }]}>{headerTitle}</Text>
          </View>
          <View style={s.headerRight}>
            {/* Mute toggle */}
            <Pressable
              onPress={() => setIsMuted((m) => !m)}
              style={[s.muteBtn, { backgroundColor: dt.surfaceMid }]}
            >
              <Ionicons
                name={isMuted ? "volume-mute" : "notifications"}
                size={18}
                color={dt.textSecondary}
              />
            </Pressable>
            {/* Close */}
            <Pressable
              onPress={handleClose}
              style={[s.closeBtn, { backgroundColor: dt.surfaceMid }]}
            >
              <Ionicons name="close" size={18} color={dt.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* ── Mode tabs (only when idle) ── */}
        {!showSavePrompt && (
          <View style={[s.modeTabs, { backgroundColor: dt.surfaceLow }]}>
            {modeTabs.map((tab) => {
              const isActive = isIdle
                ? activeMode === tab.key
                : tab.key === "focus"
                  ? !isBreak
                  : tab.key === "long"
                    ? isLongBreak
                    : isBreak && !isLongBreak;
              const tabAccent =
                tab.key === "focus"
                  ? dt.primary
                  : tab.key === "short"
                    ? dt.secondary
                    : dt.tertiary;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleModeTab(tab.key)}
                  style={[
                    s.modeTab,
                    {
                      backgroundColor: isActive
                        ? dt.surfaceCard
                        : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.modeTabText,
                      {
                        color: isActive ? tabAccent : dt.textSecondary,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <Text
                    style={[
                      s.modeTabText,
                      {
                        color: isActive ? tabAccent : dt.outlineVariant,
                        fontWeight: "500",
                        fontSize: 11,
                        marginTop: 2,
                      },
                    ]}
                  >
                    {tab.mins}m
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Cycle indicator ── */}
        {!showSavePrompt && <CycleIndicator />}

        {/* ══════════════════════════════════════════
            SAVE PROMPT
        ══════════════════════════════════════════ */}
        {showSavePrompt ? (
          <ScrollView
            style={s.promptScroll}
            contentContainerStyle={s.promptScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                s.heroCelebCard,
                {
                  backgroundColor: dt.tertiaryContainer,
                  shadowColor: dt.shadow,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="party-popper"
                size={48}
                color={dt.onTertiaryContainer}
                style={{ marginBottom: 12 }}
              />
              <Text style={[s.heroTitle, { color: dt.onTertiaryContainer }]}>
                Pomodoro Complete!
              </Text>
              <Text style={[s.heroSubtitle, { color: dt.textSecondary }]}>
                {session?.subject
                  ? `You studied ${session.subject}`
                  : "Great work"}{" "}
                — keep it up!
              </Text>

              <Text style={[s.minutesValue, { color: dt.primary }]}>
                {getElapsedMinutes()}
              </Text>
              <Text style={[s.minutesLabel, { color: dt.textSecondary }]}>
                minutes studied
              </Text>

              {/* Cycle progress inside prompt */}
              <View
                style={[
                  s.cycleSummaryRow,
                  { backgroundColor: dt.onTertiaryContainer + "15" },
                ]}
              >
                <MaterialCommunityIcons
                  name="food-apple"
                  size={16}
                  color={dt.onTertiaryContainer}
                />
                <Text
                  style={[
                    s.cycleSummaryText,
                    { color: dt.onTertiaryContainer },
                  ]}
                >
                  {pomodoroCount} pomodoro
                  {pomodoroCount !== 1 ? "s" : ""} completed
                  {pomodoroCount % POMODORO.POMODOROS_PER_LONG_BREAK === 0 &&
                  pomodoroCount > 0
                    ? " · Long break earned! 🌙"
                    : ` · ${pomodosUntilLongBreak} until long break`}
                </Text>
              </View>
            </View>

            <View style={s.promptActionsWrap}>
              {/* Save & Take Break */}
              <Pressable
                onPress={handleSaveAndContinue}
                style={({ pressed }) => [
                  s.actionBtn,
                  {
                    backgroundColor: dt.secondary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={s.actionBtnText}>
                  {pomodoroCount > 0 &&
                  pomodoroCount % POMODORO.POMODOROS_PER_LONG_BREAK === 0
                    ? "Save & Take Long Break 🌙"
                    : "Save & Take Short Break ☕"}
                </Text>
              </Pressable>

              {/* Skip Break */}
              <Pressable
                onPress={handleSkipBreakFromPrompt}
                style={({ pressed }) => [
                  s.outlineBtn,
                  {
                    borderColor: dt.secondary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[s.outlineBtnText, { color: dt.secondary }]}>
                  Skip Break, Keep Studying
                </Text>
              </Pressable>

              {/* End Session */}
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  s.textBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[s.textBtnText, { color: dt.textSecondary }]}>
                  End Session
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : isIdle ? (
          /* ══════════════════════════════════════════
              SETUP VIEW
          ══════════════════════════════════════════ */
          <ScrollView
            style={s.setupScroll}
            contentContainerStyle={s.setupScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                s.setupCard,
                { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
              ]}
            >
              {/* Section title */}
              {activeMode === "focus" ? (
                <>
                  <View style={s.sectionTitleRow}>
                    <View
                      style={[s.sectionAccent, { backgroundColor: dt.primary }]}
                    />
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
                </>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 16 }}>
                  <MaterialCommunityIcons
                    name={activeMode === "short" ? "coffee" : "weather-night"}
                    size={48}
                    color={activeMode === "short" ? dt.secondary : dt.tertiary}
                    style={{ marginBottom: 12 }}
                  />
                  <Text
                    style={[
                      s.sectionTitle,
                      { color: dt.text, textAlign: "center", marginBottom: 8 },
                    ]}
                  >
                    {activeMode === "short" ? "Short Break" : "Long Break"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: dt.textSecondary,
                      textAlign: "center",
                      lineHeight: 20,
                      marginBottom: 8,
                    }}
                  >
                    {activeMode === "short"
                      ? `Take a ${POMODORO.BREAK_MINS}-minute breather before your next session.`
                      : `Great work! Enjoy a ${POMODORO.LONG_BREAK_MINS}-minute long break — you've earned it.`}
                  </Text>
                </View>
              )}

              {/* Start button */}
              <Pressable
                onPress={handleStartSession}
                disabled={activeMode === "focus" && !subject.trim()}
                style={({ pressed }) => [
                  s.actionBtn,
                  {
                    backgroundColor:
                      activeMode === "focus"
                        ? subject.trim()
                          ? dt.primary
                          : dt.surfaceHigh
                        : activeMode === "short"
                          ? dt.secondary
                          : dt.tertiary,
                    opacity:
                      activeMode === "focus" && !subject.trim()
                        ? 0.45
                        : pressed
                          ? 0.85
                          : 1,
                  },
                ]}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {activeMode === "focus" ? (
                    <Ionicons name="play-circle" size={18} color="#ffffff" />
                  ) : activeMode === "short" ? (
                    <MaterialCommunityIcons
                      name="coffee"
                      size={18}
                      color="#ffffff"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="weather-night"
                      size={18}
                      color="#ffffff"
                    />
                  )}
                  <Text style={s.actionBtnText}>
                    {activeMode === "focus"
                      ? `Start ${POMODORO.WORK_MINS} min Focus`
                      : activeMode === "short"
                        ? `Start ${POMODORO.BREAK_MINS} min Break`
                        : `Start ${POMODORO.LONG_BREAK_MINS} min Long Break`}
                  </Text>
                </View>
              </Pressable>

              {/* Pomodoro count */}
              {pomodoroCount > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    marginTop: 16,
                  }}
                >
                  <MaterialCommunityIcons
                    name="food-apple"
                    size={13}
                    color={dt.tertiary}
                  />
                  <Text
                    style={[
                      s.pomodoroCount,
                      { color: dt.tertiary, marginTop: 0 },
                    ]}
                  >
                    {pomodoroCount} pomodoro
                    {pomodoroCount !== 1 ? "s" : ""} completed today
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        ) : (
          /* ══════════════════════════════════════════
              TIMER VIEW  (running / paused)
          ══════════════════════════════════════════ */
          <View style={s.timerContainer}>
            {/* Subject chip */}
            {session?.subject ? (
              <View
                style={[
                  s.subjectChip,
                  { backgroundColor: dt.primaryContainer },
                ]}
              >
                <Text style={[s.subjectChipText, { color: dt.primary }]}>
                  {session.subject}
                </Text>
              </View>
            ) : null}

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
              <View
                style={[
                  s.timerProgressOverlay,
                  {
                    backgroundColor: timerAccentColor,
                    height: `${progress * 100}%`,
                  },
                ]}
              />
              <Text style={[s.timerText, { color: dt.text }]}>
                {formatCountdown(secondsRemaining)}
              </Text>
              <Text style={[s.timerLabel, { color: timerAccentColor }]}>
                {isBreak
                  ? isLongBreak
                    ? "Long Break"
                    : "Short Break"
                  : "Focus"}
              </Text>
            </Animated.View>

            {/* Control buttons */}
            <View style={s.controlsRow}>
              {/* Pause / Resume */}
              <Pressable
                onPress={handlePauseResume}
                style={({ pressed }) => [
                  s.controlBtn,
                  {
                    backgroundColor: dt.surfaceHigh,
                    shadowColor: dt.shadow,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={isRunning ? "pause" : "play"}
                  size={18}
                  color={dt.primary}
                />
                <Text style={[s.controlBtnText, { color: dt.primary }]}>
                  {isRunning ? "Pause" : "Resume"}
                </Text>
              </Pressable>

              {/* Stop */}
              <Pressable
                onPress={handleStop}
                style={({ pressed }) => [
                  s.controlBtn,
                  {
                    backgroundColor: dt.error,
                    shadowColor: dt.shadow,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name="stop" size={18} color="#ffffff" />
                <Text style={[s.controlBtnText, { color: "#ffffff" }]}>
                  Stop
                </Text>
              </Pressable>
            </View>

            {/* Skip button */}
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [
                s.skipBtn,
                {
                  borderColor: timerAccentColor,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name="play-skip-forward"
                size={16}
                color={timerAccentColor}
              />
              <Text style={[s.skipBtnText, { color: timerAccentColor }]}>
                {isBreak ? "Skip Break" : "Skip Focus"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}
