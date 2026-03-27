import React, { useCallback, useEffect, useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
   Public Types
───────────────────────────────────────────────────────── */
export type AlertButtonStyle = "default" | "cancel" | "destructive";

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  /** Body message — shown as plain text. Ignored when `factContent` is set. */
  message?: string;
  /**
   * When provided the alert switches to "view-fact" mode:
   * renders a scrollable fact body card instead of a plain message.
   */
  factContent?: string;
  buttons?: AlertButton[];
  /** Decorative emoji shown above the title. */
  icon?: string;
  onDismiss?: () => void;
}

/* ─────────────────────────────────────────────────────────
   StyleSheets — declared BEFORE component
───────────────────────────────────────────────────────── */
const overlayStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 28,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 32,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
  },
  divider: {
    height: 1,
    marginTop: 20,
  },
  buttonGroup: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    gap: 10,
  },
  button: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  buttonOutline: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  buttonGhost: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonGhostText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

const factStyles = StyleSheet.create({
  factCard: {
    marginHorizontal: 24,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  factScroll: {
    maxHeight: 180,
  },
  factText: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24,
  },
  factTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  factTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  factTagText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});

/* ─────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────── */
export default function CustomAlert({
  visible,
  title,
  message,
  factContent,
  buttons,
  icon,
  onDismiss,
}: CustomAlertProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const dt = useMemo<DesignTokens>(
    () => ({
      bg:                  isDark ? "#0d1117" : "#f8fafc",
      surfaceLow:          isDark ? "#161b22" : "#f1f5f9",
      surfaceMid:          isDark ? "#1c2128" : "#e8edf2",
      surfaceHigh:         isDark ? "#21262d" : "#dde3e9",
      surfaceHighest:      isDark ? "#30363d" : "#ced5dc",
      surfaceCard:         isDark ? "#161b22" : "#ffffff",
      primary:             isDark ? "#7fb6ff" : "#0060ad",
      primaryContainer:    isDark ? "#003e7a" : "#d4e7ff",
      onPrimary:           isDark ? "#003258" : "#ffffff",
      secondary:           isDark ? "#4ecdc4" : "#146a65",
      secondaryContainer:  isDark ? "#0d3d3a" : "#cef5f1",
      onSecondary:         isDark ? "#00312e" : "#ffffff",
      tertiary:            isDark ? "#eec540" : "#745c00",
      tertiaryContainer:   isDark ? "#564400" : "#ffeea3",
      onTertiaryContainer: isDark ? "#ffeea3" : "#241a00",
      text:                isDark ? "#e6edf3" : "#0d1117",
      textSecondary:       isDark ? "#8b949e" : "#57606a",
      outline:             isDark ? "#30363d" : "#d0d7de",
      outlineVariant:      isDark ? "#21262d" : "#e8edf2",
      error:               isDark ? "#f87171" : "#ac3434",
      shadow:              isDark ? "rgba(0,0,0,0.5)" : "rgba(42,52,57,0.14)",
    }),
    [isDark],
  );

  // Animation values
  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.set(withTiming(1, { duration: 180 }));
      scale.set(withSpring(1, { damping: 18, stiffness: 260 }));
    } else {
      opacity.set(withTiming(0, { duration: 140 }));
      scale.set(withTiming(0.92, { duration: 140 }));
    }
  }, [visible, opacity, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    opacity: opacity.get(),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  // Resolve buttons — default to a single "OK" button
  const resolvedButtons: AlertButton[] = buttons && buttons.length > 0
    ? buttons
    : [{ text: "OK", style: "default" }];

  const handleButtonPress = useCallback(
    (btn: AlertButton) => {
      onDismiss?.();
      btn.onPress?.();
    },
    [onDismiss],
  );

  // Determine icon to show (auto-pick if not provided)
  const resolvedIcon = icon ?? (factContent ? "📜" : "💬");

  // Icon circle background colour
  const iconBg = factContent
    ? dt.primaryContainer
    : resolvedButtons.some((b) => b.style === "destructive")
      ? dt.error + "18"
      : dt.primaryContainer;

  // Render a single button with correct visual style
  const renderButton = (btn: AlertButton, index: number) => {
    const isDestructive = btn.style === "destructive";
    const isCancel = btn.style === "cancel";

    if (isCancel) {
      return (
        <Pressable
          key={index}
          onPress={() => handleButtonPress(btn)}
          style={({ pressed }) => [
            overlayStyles.buttonGhost,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[overlayStyles.buttonGhostText, { color: dt.textSecondary }]}>
            {btn.text}
          </Text>
        </Pressable>
      );
    }

    if (isDestructive) {
      return (
        <Pressable
          key={index}
          onPress={() => handleButtonPress(btn)}
          style={({ pressed }) => [
            overlayStyles.button,
            { backgroundColor: dt.error, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[overlayStyles.buttonText, { color: "#ffffff" }]}>
            {btn.text}
          </Text>
        </Pressable>
      );
    }

    // Default / primary button
    // If there are multiple non-cancel buttons, the first one is primary (filled),
    // subsequent ones are outlined.
    const nonCancelButtons = resolvedButtons.filter((b) => b.style !== "cancel");
    const isFirstNonCancel = nonCancelButtons[0] === btn;

    if (!isFirstNonCancel) {
      return (
        <Pressable
          key={index}
          onPress={() => handleButtonPress(btn)}
          style={({ pressed }) => [
            overlayStyles.buttonOutline,
            { borderColor: dt.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[overlayStyles.buttonText, { color: dt.primary }]}>
            {btn.text}
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={index}
        onPress={() => handleButtonPress(btn)}
        style={({ pressed }) => [
          overlayStyles.button,
          { backgroundColor: dt.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[overlayStyles.buttonText, { color: dt.onPrimary }]}>
          {btn.text}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          overlayStyles.backdrop,
          backdropStyle,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Tap backdrop to dismiss (same behaviour as native Alert cancel) */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onDismiss}
        />

        <Animated.View
          style={[
            overlayStyles.card,
            cardStyle,
            {
              backgroundColor: dt.surfaceCard,
              shadowColor: dt.shadow,
            },
          ]}
        >
          {/* Icon */}
          <View style={overlayStyles.iconWrap}>
            <View style={[overlayStyles.iconCircle, { backgroundColor: iconBg }]}>
              <Text style={overlayStyles.iconText}>{resolvedIcon}</Text>
            </View>
          </View>

          {/* Title + Message */}
          <View style={overlayStyles.body}>
            <Text style={[overlayStyles.title, { color: dt.text }]}>
              {title}
            </Text>
            {!factContent && message ? (
              <Text style={[overlayStyles.message, { color: dt.textSecondary }]}>
                {message}
              </Text>
            ) : null}
          </View>

          {/* Fact body (view-fact mode) */}
          {factContent ? (
            <View
              style={[
                factStyles.factCard,
                {
                  backgroundColor: dt.primaryContainer + "30",
                  borderColor: dt.primaryContainer,
                },
              ]}
            >
              <View style={factStyles.factTagRow}>
                <View style={[factStyles.factTag, { backgroundColor: dt.primaryContainer }]}>
                  <Text style={[factStyles.factTagText, { color: dt.primary }]}>
                    Vault Entry
                  </Text>
                </View>
              </View>
              <ScrollView
                style={factStyles.factScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={[factStyles.factText, { color: dt.text }]}>
                  {factContent}
                </Text>
              </ScrollView>
            </View>
          ) : null}

          {/* Divider */}
          <View style={[overlayStyles.divider, { backgroundColor: dt.outline }]} />

          {/* Buttons */}
          <View style={overlayStyles.buttonGroup}>
            {resolvedButtons.map((btn, index) => renderButton(btn, index))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}