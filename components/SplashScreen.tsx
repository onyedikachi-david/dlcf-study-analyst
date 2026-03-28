import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const aura1Scale = useRef(new Animated.Value(1)).current;
  const aura1Opacity = useRef(new Animated.Value(0.15)).current;
  const aura2Scale = useRef(new Animated.Value(1)).current;
  const aura2Opacity = useRef(new Animated.Value(0.2)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;

  // Design tokens
  const dt = {
    bg: isDark ? "#0f0f1a" : "#f6fafe",
    surfaceLow: isDark ? "#1a1a2e" : "#eff4f9",
    surfaceMid: isDark ? "#1e1e32" : "#e8eff4",
    surfaceHigh: isDark ? "#2a2a45" : "#e1e9f0",
    surfaceHighest: isDark ? "#333352" : "#dae4eb",
    primary: isDark ? "#7fb6ff" : "#0060ad",
    primaryContainer: isDark ? "#2a4a7a" : "#9ac3ff",
    secondary: isDark ? "#4ecdc4" : "#146a65",
    secondaryContainer: isDark ? "#1a4a47" : "#a7f3ec",
    text: isDark ? "#f1f5f9" : "#2a3439",
    textSecondary: isDark ? "#94a3b8" : "#576067",
    outline: isDark ? "#64748b" : "#727c82",
    outlineVariant: isDark ? "#475569" : "#a9b3ba",
  };

  useEffect(() => {
    // Aura pulsing animations (continuous)
    const aura1Animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(aura1Scale, {
            toValue: 1.4,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(aura1Opacity, {
            toValue: 0.05,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(aura1Scale, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(aura1Opacity, {
            toValue: 0.15,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const aura2Animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(aura2Scale, {
            toValue: 1.3,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(aura2Opacity, {
            toValue: 0.08,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(aura2Scale, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(aura2Opacity, {
            toValue: 0.2,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    // Loading ring rotation (continuous)
    const ringAnimation = Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
    );

    // Entry animations sequence
    const entryAnimation = Animated.sequence([
      // Initial delay before anything appears
      Animated.delay(400),
      // Logo entrance
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 35,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Pause before title
      Animated.delay(300),
      // Title entrance
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 40,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      // Pause before subtitle
      Animated.delay(200),
      // Subtitle entrance
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Pause before loading interface
      Animated.delay(400),
      // Loading and footer entrance
      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // Start all animations
    aura1Animation.start();
    aura2Animation.start();
    ringAnimation.start();
    entryAnimation.start();

    // Cleanup
    return () => {
      aura1Animation.stop();
      aura2Animation.stop();
      ringAnimation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringRotationInterpolate = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { backgroundColor: dt.bg }]}>
      {/* Ethereal Background Layers */}
      <View style={styles.backgroundContainer}>
        {/* Primary aura blob - top left */}
        <Animated.View
          style={[
            styles.auraBlob,
            styles.aura1,
            {
              backgroundColor: dt.primaryContainer,
              transform: [{ scale: aura1Scale }],
              opacity: aura1Opacity,
            },
          ]}
        />
        {/* Secondary aura blob - bottom right */}
        <Animated.View
          style={[
            styles.auraBlob,
            styles.aura2,
            {
              backgroundColor: dt.secondaryContainer,
              transform: [{ scale: aura2Scale }],
              opacity: aura2Opacity,
            },
          ]}
        />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          {/* Glow behind logo */}
          <View
            style={[
              styles.logoGlow,
              {
                backgroundColor: isDark
                  ? "rgba(127,182,255,0.2)"
                  : "rgba(255,255,255,0.4)",
              },
            ]}
          />
          {/* Logo icon */}
          <View
            style={[
              styles.logoIcon,
              {
                backgroundColor: dt.primary,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={56}
              color="#ffffff"
            />
          </View>
        </Animated.View>

        {/* App Branding */}
        <View style={styles.brandingContainer}>
          <Animated.View
            style={[
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <Text style={[styles.appTitle, { color: dt.primary }]}>
              DLCF Study
            </Text>
            <Text style={[styles.appTitleAccent, { color: dt.secondary }]}>
              Analyst
            </Text>
          </Animated.View>

          <Animated.Text
            style={[
              styles.appSubtitle,
              { color: dt.textSecondary, opacity: subtitleOpacity },
            ]}
          >
            Optimizing your growth journey through data and focus.
          </Animated.Text>
        </View>
      </View>

      {/* Loading Interface */}
      <Animated.View
        style={[
          styles.loadingContainer,
          { bottom: insets.bottom + 100, opacity: loadingOpacity },
        ]}
      >
        <View
          style={[
            styles.loadingPill,
            {
              backgroundColor: isDark
                ? "rgba(51,51,82,0.6)"
                : "rgba(218,228,235,0.6)",
            },
          ]}
        >
          {/* Spinning ring */}
          <Animated.View
            style={[
              styles.loadingRing,
              {
                borderTopColor: dt.primary,
                transform: [{ rotate: ringRotationInterpolate }],
              },
            ]}
          />
          <Text style={[styles.loadingText, { color: dt.primary }]}>
            INITIALIZING ANALYST
          </Text>
        </View>

        {/* Quote */}
        <Text style={[styles.quote, { color: dt.outline }]}>
          {'"Deep work is the superpower of the 21st century."'}
        </Text>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          { bottom: insets.bottom + 24, opacity: footerOpacity },
        ]}
      >
        <Text style={[styles.footerText, { color: dt.outlineVariant }]}>
          AURA STUDY ECOSYSTEM
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  auraBlob: {
    position: "absolute",
    borderRadius: 9999,
  },
  aura1: {
    top: -SCREEN_HEIGHT * 0.1,
    left: -SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
  },
  aura2: {
    bottom: -SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 32,
  },
  logoGlow: {
    position: "absolute",
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    borderRadius: 9999,
  },
  logoIcon: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  brandingContainer: {
    alignItems: "center",
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  appTitleAccent: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    marginTop: -8,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 12,
    maxWidth: 280,
    lineHeight: 24,
  },
  loadingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  loadingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  loadingRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  loadingText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  quote: {
    fontSize: 10,
    fontWeight: "500",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
    maxWidth: 280,
    lineHeight: 16,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 3,
  },
});

export default SplashScreen;
