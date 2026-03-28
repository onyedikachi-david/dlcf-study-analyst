import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";

/* ─── MD3 brand colours (mirrors DesignTokens across all screens) ─── */
const LIGHT = {
  primary: "#0060ad",
  bg: "#f8fafc",
  surfaceCard: "#ffffff",
  surfaceLow: "#f1f5f9",
  surfaceMid: "#e8edf2",
  text: "#0d1117",
  textMuted: "#8b949e",
  outline: "#d0d7de",
};

const DARK = {
  primary: "#7fb6ff",
  bg: "#0d1117",
  surfaceCard: "#161b22",
  surfaceLow: "#161b22",
  surfaceMid: "#1c2128",
  text: "#e6edf3",
  textMuted: "#57606a",
  outline: "#30363d",
};

/* ─── Tab definitions ─── */
type TabIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface TabDef {
  name: string;
  title: string;
  icon: TabIconName; // inactive
  iconActive: TabIconName; // active (filled variant)
}

const TABS: TabDef[] = [
  {
    name: "index",
    title: "Home",
    icon: "home-outline",
    iconActive: "home",
  },
  {
    name: "tracker",
    title: "Tracker",
    icon: "timer-sand-empty",
    iconActive: "timer-sand",
  },
  {
    name: "board",
    title: "Board",
    icon: "trophy-outline",
    iconActive: "trophy",
  },
  {
    name: "analytics",
    title: "Analytics",
    icon: "chart-bar",
    iconActive: "chart-bar",
  },
  {
    name: "vault",
    title: "Vault",
    icon: "archive-outline",
    iconActive: "archive",
  },
  {
    name: "profile",
    title: "Profile",
    icon: "account-circle-outline",
    iconActive: "account-circle",
  },
];

/* ─── Custom tab icon with active pill indicator ─── */
function TabIcon({
  def,
  focused,
  color,
  isDark,
}: {
  def: TabDef;
  focused: boolean;
  color: string;
  isDark: boolean;
}) {
  const C = isDark ? DARK : LIGHT;

  return (
    <View style={styles.iconWrap}>
      {focused && (
        <View
          style={[styles.activePill, { backgroundColor: C.primary + "1f" }]}
        />
      )}
      <MaterialCommunityIcons
        name={focused ? def.iconActive : def.icon}
        size={24}
        color={color}
      />
    </View>
  );
}

/* ─── Layout ─── */
export default function TabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = isDark ? DARK : LIGHT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,

        /* Active / inactive colours */
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,

        /* Tab bar surface */
        tabBarStyle: {
          backgroundColor: C.surfaceCard,
          borderTopColor: C.outline,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "ios" ? 76 : 60,
          paddingBottom: Platform.OS === "ios" ? 16 : 4,
          paddingTop: 6,
          elevation: 8,
          shadowColor: isDark ? "#000" : "rgba(42,52,57,0.12)",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 12,
        },

        /* Label styling */
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 0.2,
          marginTop: 0,
        },

        tabBarItemStyle: {
          paddingVertical: 0,
          paddingHorizontal: 0,
        },

        tabBarShowLabel: true,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                def={tab}
                focused={focused}
                color={color}
                isDark={isDark}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    position: "absolute",
    width: 40,
    height: 28,
    borderRadius: 14,
  },
});
