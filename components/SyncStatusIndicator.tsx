import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  onPress?: () => void;
  size?: "small" | "medium";
}

export function SyncStatusIndicator({
  status,
  onPress,
  size = "small",
}: SyncStatusIndicatorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Animation values
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const auraScale = useRef(new Animated.Value(1)).current;
  const auraOpacity = useRef(new Animated.Value(0.3)).current;

  // Design tokens
  const dt = {
    primary: isDark ? "#7fb6ff" : "#0060ad",
    secondary: isDark ? "#4ecdc4" : "#146a65",
    tertiary: isDark ? "#eec540" : "#745c00",
    error: isDark ? "#f87171" : "#ac3434",
    surface: isDark ? "#1e1e32" : "#ffffff",
    surfaceHigh: isDark ? "#2a2a45" : "#e1e9f0",
  };

  // Get status-specific config
  const getStatusConfig = () => {
    switch (status) {
      case "synced":
        return {
          icon: "cloud-check" as const,
          color: dt.secondary,
          pulseDuration: 3000,
          pulseMinScale: 0.95,
          pulseMaxScale: 1.05,
          auraDuration: 4000,
          auraMaxScale: 1.8,
        };
      case "syncing":
        return {
          icon: "cloud-sync" as const,
          color: dt.primary,
          pulseDuration: 1200,
          pulseMinScale: 0.9,
          pulseMaxScale: 1.1,
          auraDuration: 1500,
          auraMaxScale: 2,
        };
      case "offline":
        return {
          icon: "cloud-off-outline" as const,
          color: dt.tertiary,
          pulseDuration: 2000,
          pulseMinScale: 0.85,
          pulseMaxScale: 1.15,
          auraDuration: 2500,
          auraMaxScale: 2.2,
        };
      case "error":
        return {
          icon: "cloud-alert" as const,
          color: dt.error,
          pulseDuration: 800,
          pulseMinScale: 0.85,
          pulseMaxScale: 1.15,
          auraDuration: 1000,
          auraMaxScale: 2.5,
        };
    }
  };

  const config = getStatusConfig();
  const iconSize = size === "small" ? 12 : 16;
  const containerSize = size === "small" ? 20 : 28;

  useEffect(() => {
    // Icon pulse animation
    const iconPulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: config.pulseMaxScale,
            duration: config.pulseDuration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: config.pulseDuration / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: config.pulseMinScale,
            duration: config.pulseDuration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: config.pulseDuration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    // Aura pulse animation (expanding ring effect)
    const auraPulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(auraScale, {
            toValue: config.auraMaxScale,
            duration: config.auraDuration,
            useNativeDriver: true,
          }),
          Animated.timing(auraOpacity, {
            toValue: 0,
            duration: config.auraDuration,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(auraScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(auraOpacity, {
            toValue: 0.3,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    iconPulse.start();
    auraPulse.start();

    return () => {
      iconPulse.stop();
      auraPulse.stop();
    };
  }, [
    status,
    config.pulseDuration,
    config.pulseMinScale,
    config.pulseMaxScale,
    config.auraDuration,
    config.auraMaxScale,
    pulseScale,
    pulseOpacity,
    auraScale,
    auraOpacity,
  ]);

  const content = (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      {/* Pulsating aura effect */}
      <Animated.View
        style={[
          styles.aura,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: config.color,
            transform: [{ scale: auraScale }],
            opacity: auraOpacity,
          },
        ]}
      />

      {/* Icon container with background */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: dt.surface,
            borderColor: config.color,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={iconSize}
          color={config.color}
        />
      </Animated.View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  aura: {
    position: "absolute",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default SyncStatusIndicator;
