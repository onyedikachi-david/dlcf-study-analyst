import { useTimerStore, useWeekStore } from "@/src/stores";
import { Colors } from "@/src/theme/colors";
import { DAYS, POMODORO } from "@/src/utils/constants";
import {
    formatCountdown,
    formatTimeFromMinutes,
    getCurrentDayIndex,
} from "@/src/utils/time";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    AppState,
    AppStateStatus,
    Modal,
    Pressable,
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

interface PomodoroTimerProps {
  visible: boolean;
  onClose: () => void;
}

export function PomodoroTimer({ visible, onClose }: PomodoroTimerProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

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

  const [subject, setSubject] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(
    POMODORO.WORK_MINS * 60,
  );
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number>(0);

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

  const progress = session
    ? 1 - secondsRemaining / (session.durationMins * 60)
    : 0;

  const isRunning = session?.status === "running";
  const isPaused = session?.status === "paused";
  const isIdle =
    !session ||
    session.status === "completed" ||
    session.status === "cancelled";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {session?.type === "break" ? "☕ Break Time" : "📚 Study Session"}
          </Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Text
              style={[styles.closeBtnText, { color: colors.textSecondary }]}
            >
              ✕
            </Text>
          </Pressable>
        </View>

        {showSavePrompt ? (
          <View style={styles.savePrompt}>
            <Text style={[styles.saveTitle, { color: colors.text }]}>
              🎉 Pomodoro Complete!
            </Text>
            <Text
              style={[styles.saveSubtitle, { color: colors.textSecondary }]}
            >
              You studied {session?.subject} for {getElapsedMinutes()} minutes.
            </Text>

            <Pressable
              onPress={handleSaveAndContinue}
              style={[styles.primaryBtn, { backgroundColor: colors.success }]}
            >
              <Text style={styles.primaryBtnText}>Save & Take Break</Text>
            </Pressable>

            <Pressable
              onPress={handleSkipBreak}
              style={[styles.secondaryBtn, { borderColor: colors.primary }]}
            >
              <Text
                style={[styles.secondaryBtnText, { color: colors.primary }]}
              >
                Skip Break, Continue Studying
              </Text>
            </Pressable>

            <Pressable onPress={handleClose} style={styles.textBtn}>
              <Text
                style={[styles.textBtnText, { color: colors.textSecondary }]}
              >
                End Session
              </Text>
            </Pressable>
          </View>
        ) : isIdle ? (
          <View style={styles.setupContainer}>
            <Text style={[styles.setupLabel, { color: colors.textSecondary }]}>
              What are you studying?
            </Text>
            <TextInput
              style={[
                styles.subjectInput,
                { backgroundColor: colors.surface, color: colors.text },
              ]}
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g., CHM101 Stoichiometry"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <View style={styles.presetsRow}>
              {["CHM101", "PHY103", "MTH101", "BIO101"].map((code) => (
                <Pressable
                  key={code}
                  onPress={() => setSubject(code)}
                  style={[
                    styles.presetBtn,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>
                    {code}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleStartWork}
              disabled={!subject.trim()}
              style={[
                styles.startBtn,
                {
                  backgroundColor: subject.trim()
                    ? colors.primary
                    : colors.surface,
                  opacity: subject.trim() ? 1 : 0.5,
                },
              ]}
            >
              <Text style={styles.startBtnText}>
                Start {POMODORO.WORK_MINS} min Session
              </Text>
            </Pressable>

            {session?.pomodoroCount ? (
              <Text
                style={[styles.pomodoroCount, { color: colors.textSecondary }]}
              >
                🍅 {session.pomodoroCount} pomodoros completed today
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.timerContainer}>
            <Text
              style={[styles.subjectLabel, { color: colors.textSecondary }]}
            >
              {session?.subject}
            </Text>

            <Animated.View style={[styles.timerCircle, pulseStyle]}>
              <View
                style={[
                  styles.timerProgress,
                  {
                    backgroundColor:
                      session?.type === "break"
                        ? colors.success
                        : colors.primary,
                    height: `${progress * 100}%`,
                  },
                ]}
              />
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatCountdown(secondsRemaining)}
              </Text>
              <Text
                style={[styles.timerLabel, { color: colors.textSecondary }]}
              >
                {session?.type === "break" ? "Break" : "Focus"}
              </Text>
            </Animated.View>

            <View style={styles.controlsRow}>
              <Pressable
                onPress={handlePauseResume}
                style={[styles.controlBtn, { backgroundColor: colors.surface }]}
              >
                <Text style={styles.controlIcon}>
                  {isRunning ? "⏸️" : "▶️"}
                </Text>
                <Text style={[styles.controlText, { color: colors.text }]}>
                  {isRunning ? "Pause" : "Resume"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleStop}
                style={[styles.controlBtn, { backgroundColor: colors.error }]}
              >
                <Text style={styles.controlIcon}>⏹️</Text>
                <Text style={styles.controlTextWhite}>Stop</Text>
              </Pressable>
            </View>

            {session?.type === "break" ? (
              <Pressable onPress={handleSkipBreak} style={styles.textBtn}>
                <Text style={[styles.textBtnText, { color: colors.primary }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 24,
  },
  setupContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  setupLabel: {
    fontSize: 16,
    marginBottom: 12,
  },
  subjectInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  presetText: {
    fontSize: 13,
    fontWeight: "500",
  },
  startBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  pomodoroCount: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
  timerContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
  subjectLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 32,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  timerProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.2,
  },
  timerText: {
    fontSize: 56,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 48,
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  controlIcon: {
    fontSize: 18,
  },
  controlText: {
    fontSize: 15,
    fontWeight: "600",
  },
  controlTextWhite: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  savePrompt: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: "center",
  },
  saveTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  saveSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  textBtn: {
    paddingVertical: 12,
  },
  textBtnText: {
    fontSize: 14,
  },
});
