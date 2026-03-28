import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomAlert, { type AlertButton } from "@/components/CustomAlert";
import { useAppStore } from "@/src/stores";
import { minutesToHrs } from "@/src/utils/time";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
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
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    maxWidth: 280,
  },
  headerStats: {
    alignItems: "flex-end",
  },
  headerStatValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  /* Search Bar */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
  },
});

const heroStyles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitleAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
  },

  /* Bento Grid */
  bentoRow: {
    flexDirection: "row",
    gap: 12,
  },
  heroCard: {
    flex: 2,
    borderRadius: 22,
    padding: 22,
    minHeight: 200,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
  },
  heroCardDecor: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  heroTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  heroTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroDate: {
    fontSize: 11,
    fontWeight: "500",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginBottom: 16,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  heroIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Side Card */
  sideCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    justifyContent: "space-between",
    borderWidth: 1,
  },
  sideCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  sideCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  sideCardDesc: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
  },
  sideCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  sideCardFooterLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sideCardFooterIcon: {
    fontSize: 16,
  },
});

const inputStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: "500",
    minHeight: 90,
    textAlignVertical: "top",
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  charCount: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "right",
  },
});

const storageStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 14,
    opacity: 0.85,
  },
  cardBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  cardBtnText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardDecor: {
    fontSize: 56,
    opacity: 0.15,
    marginLeft: 12,
  },
});

const factStyles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  grid: {
    gap: 10,
  },
  factCard: {
    borderRadius: 18,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  factCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  factIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  factMeta: {
    flex: 1,
  },
  factTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  factDate: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  factText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginBottom: 12,
  },
  factFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  factTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  factTagText: {
    fontSize: 9,
    fontWeight: "700",
  },
  factDeleteBtn: {
    padding: 4,
  },
  factDeleteText: {
    fontSize: 14,
  },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },

  /* Swipe hint */
  hint: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    paddingVertical: 8,
  },
});

const swipeStyles = StyleSheet.create({
  container: {
    position: "relative",
    marginBottom: 10,
  },
  deleteBg: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});

/* ═══════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════ */

interface FactItemProps {
  fact: string;
  index: number;
  totalCount: number;
  onDelete: (index: number) => void;
  onDeleteRequest: (index: number) => void;
  dt: DesignTokens;
}

const FactItem = memo(function FactItem({
  fact,
  index,
  totalCount,
  onDelete,
  onDeleteRequest,
  dt,
}: FactItemProps) {
  const translateX = useSharedValue(0);
  const factNumber = totalCount - index;

  // Cycle through icon colors
  const iconColors = [
    { bg: dt.primaryContainer + "40", text: dt.primary },
    { bg: dt.secondaryContainer + "50", text: dt.secondary },
    { bg: dt.tertiaryContainer + "60", text: dt.tertiary },
    { bg: dt.surfaceHigh, text: dt.textSecondary },
  ];
  const iconStyle = iconColors[index % iconColors.length];

  const iconNames: React.ComponentProps<
    typeof MaterialCommunityIcons
  >["name"][] = [
    "file-document-outline",
    "lightbulb-outline",
    "brain",
    "note-text-outline",
    "book-open-outline",
    "star-four-points-outline",
    "flask-outline",
    "book-outline",
  ];
  const iconName = iconNames[index % iconNames.length];

  const handleDelete = useCallback(() => {
    onDeleteRequest(index);
  }, [index, onDeleteRequest]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(-10)
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.set(Math.max(e.translationX, -100));
      }
    })
    .onEnd((e) => {
      if (e.translationX < -60) {
        runOnJS(handleDelete)();
      }
      translateX.set(withTiming(0));
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  return (
    <View style={swipeStyles.container}>
      <View style={[swipeStyles.deleteBg, { backgroundColor: dt.error }]}>
        <Text style={swipeStyles.deleteText}>Delete</Text>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            factStyles.factCard,
            { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            animatedStyle,
          ]}
        >
          <View style={factStyles.factCardHeader}>
            <View
              style={[factStyles.factIcon, { backgroundColor: iconStyle.bg }]}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={20}
                color={iconStyle.text}
              />
            </View>
            <View style={factStyles.factMeta}>
              <Text
                style={[factStyles.factTitle, { color: dt.text }]}
                numberOfLines={1}
              >
                Fact #{factNumber}
              </Text>
              <Text style={[factStyles.factDate, { color: dt.textSecondary }]}>
                Knowledge Vault
              </Text>
            </View>
          </View>

          <Text
            style={[factStyles.factText, { color: dt.text }]}
            numberOfLines={3}
          >
            {fact}
          </Text>

          <View style={factStyles.factFooter}>
            <View
              style={[factStyles.factTag, { backgroundColor: dt.surfaceLow }]}
            >
              <Text style={[factStyles.factTagText, { color: dt.outline }]}>
                Saved
              </Text>
            </View>
            <Pressable
              onPress={handleDelete}
              style={factStyles.factDeleteBtn}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={20}
                color={dt.textSecondary}
              />
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

/* ═══════════════════════════════════════════════════
   MAIN SCREEN
   ═══════════════════════════════════════════════════ */

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { facts, addFact, removeFact, cumulativeMinutes } = useAppStore();
  const flatListRef = useRef<FlatList>(null);
  const [newFact, setNewFact] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "recent">("all");
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    factContent?: string;
    icon?: string;
    iconName?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    buttons?: AlertButton[];
  }>({ visible: false, title: "" });

  const dismissAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

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

  // Filtered facts
  const filteredFacts = useMemo(() => {
    let result = [...facts];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => f.toLowerCase().includes(query));
    }
    if (activeFilter === "recent") {
      result = result.slice(0, 5);
    }
    return result;
  }, [facts, searchQuery, activeFilter]);

  // Stats
  const totalStudyHours = minutesToHrs(cumulativeMinutes);
  const storagePercent = Math.min((facts.length / 50) * 100, 100);
  const isFactMaster = facts.length >= 10;

  // Most recent fact for hero
  const mostRecentFact = facts.length > 0 ? facts[0] : null;
  const secondFact = facts.length > 1 ? facts[1] : null;

  const handleAddFact = useCallback(() => {
    const trimmed = newFact.trim();
    if (!trimmed) return;

    const success = addFact(trimmed);
    if (success) {
      setNewFact("");
    } else {
      setAlertConfig({
        visible: true,
        title: "Vault Full",
        message: "You can only save up to 50 facts.",
        iconName: "archive-off-outline",
        buttons: [{ text: "Got it", style: "default" }],
      });
    }
  }, [newFact, addFact]);

  const handleViewAll = useCallback(() => {
    // Scroll to the facts section (after the header)
    flatListRef.current?.scrollToOffset({ offset: 600, animated: true });
  }, []);

  const handleViewFact = useCallback((fact: string) => {
    setAlertConfig({
      visible: true,
      title: "Fact from Vault",
      factContent: fact,
      iconName: "archive-eye-outline",
      buttons: [{ text: "Close", style: "cancel" }],
    });
  }, []);

  const handleShareFact = useCallback(async (fact: string) => {
    try {
      await Share.share({
        message: `📚 Fact from my Study Vault:\n\n"${fact}"\n\n— Shared via DLCF Study Analyst`,
      });
    } catch (error) {
      // User cancelled or share failed silently
    }
  }, []);

  const handleDelete = useCallback(
    (index: number) => {
      const actualIndex = facts.indexOf(filteredFacts[index]);
      setAlertConfig({
        visible: true,
        title: "Delete Fact",
        message: "Are you sure you want to delete this fact?",
        iconName: "delete-outline",
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (actualIndex !== -1) removeFact(actualIndex);
            },
          },
        ],
      });
    },
    [facts, filteredFacts, removeFact],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <FactItem
        fact={item}
        index={index}
        totalCount={filteredFacts.length}
        onDelete={handleDelete}
        onDeleteRequest={handleDelete}
        dt={dt}
      />
    ),
    [filteredFacts.length, handleDelete, dt],
  );

  return (
    <GestureHandlerRootView
      style={[baseStyles.container, { backgroundColor: dt.bg }]}
    >
      <FlatList
        ref={flatListRef}
        data={filteredFacts}
        renderItem={renderItem}
        keyExtractor={(_: string, index: number) => `fact-${index}`}
        contentContainerStyle={[
          baseStyles.scrollContent,
          { paddingTop: insets.top + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <View style={baseStyles.header}>
              <View style={baseStyles.headerRow}>
                <View>
                  <Text style={[baseStyles.headerTitle, { color: dt.text }]}>
                    Archive Vault
                  </Text>
                  <Text
                    style={[
                      baseStyles.headerSubtitle,
                      { color: dt.textSecondary },
                    ]}
                  >
                    Retrieve your past knowledge. Every fact preserved in
                    ethereal clarity.
                  </Text>
                </View>
                <View style={baseStyles.headerStats}>
                  <Text
                    style={[baseStyles.headerStatValue, { color: dt.primary }]}
                  >
                    {facts.length}
                  </Text>
                  <Text
                    style={[
                      baseStyles.headerStatLabel,
                      { color: dt.textSecondary },
                    ]}
                  >
                    /50 facts
                  </Text>
                </View>
              </View>

              {/* Search Bar */}
              <View
                style={[
                  baseStyles.searchContainer,
                  { backgroundColor: dt.surfaceLow },
                ]}
              >
                <Ionicons name="search" size={18} color={dt.outlineVariant} />
                <TextInput
                  style={[baseStyles.searchInput, { color: dt.text }]}
                  placeholder="Search your vault..."
                  placeholderTextColor={dt.outlineVariant}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* ── Recently Archived (Hero Bento) ── */}
            {mostRecentFact && (
              <View style={heroStyles.section}>
                <View style={heroStyles.sectionHeader}>
                  <View style={heroStyles.sectionTitleRow}>
                    <View
                      style={[
                        heroStyles.sectionTitleAccent,
                        { backgroundColor: dt.secondary },
                      ]}
                    />
                    <Text style={[heroStyles.sectionTitle, { color: dt.text }]}>
                      Recently Archived
                    </Text>
                  </View>
                  <Pressable onPress={handleViewAll}>
                    <Text
                      style={[heroStyles.sectionLink, { color: dt.primary }]}
                    >
                      View All
                    </Text>
                  </Pressable>
                </View>

                <View style={heroStyles.bentoRow}>
                  {/* Hero Card (Most Recent) */}
                  <View
                    style={[
                      heroStyles.heroCard,
                      {
                        backgroundColor: dt.surfaceCard,
                        shadowColor: dt.shadow,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="archive"
                      size={28}
                      color={dt.primary + "30"}
                      style={heroStyles.heroCardDecor}
                    />
                    <View>
                      <View style={heroStyles.heroTagRow}>
                        <View
                          style={[
                            heroStyles.heroTag,
                            { backgroundColor: dt.primaryContainer + "40" },
                          ]}
                        >
                          <Text
                            style={[
                              heroStyles.heroTagText,
                              { color: dt.primary },
                            ]}
                          >
                            LATEST FACT
                          </Text>
                        </View>
                        <Text
                          style={[
                            heroStyles.heroDate,
                            { color: dt.textSecondary },
                          ]}
                        >
                          Just added
                        </Text>
                      </View>
                      <Text
                        style={[heroStyles.heroTitle, { color: dt.text }]}
                        numberOfLines={2}
                      >
                        {mostRecentFact.length > 50
                          ? mostRecentFact.substring(0, 50) + "..."
                          : mostRecentFact}
                      </Text>
                      <Text
                        style={[
                          heroStyles.heroDesc,
                          { color: dt.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {mostRecentFact}
                      </Text>
                    </View>
                    <View style={heroStyles.heroActions}>
                      <Pressable
                        onPress={() => handleViewFact(mostRecentFact)}
                        style={[
                          heroStyles.heroBtn,
                          { backgroundColor: dt.primary },
                        ]}
                      >
                        <Text style={heroStyles.heroBtnText}>View Fact</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleShareFact(mostRecentFact)}
                        style={[
                          heroStyles.heroIconBtn,
                          { backgroundColor: dt.surfaceHigh },
                        ]}
                      >
                        <Ionicons
                          name="share-outline"
                          size={20}
                          color={dt.text}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Side Card (Second Fact or Placeholder) */}
                  <View
                    style={[
                      heroStyles.sideCard,
                      {
                        backgroundColor: dt.secondary + "08",
                        borderColor: dt.secondary + "15",
                      },
                    ]}
                  >
                    <View>
                      <View
                        style={[
                          heroStyles.sideCardIcon,
                          { backgroundColor: dt.secondaryContainer },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="brain"
                          size={24}
                          color={dt.secondary}
                        />
                      </View>
                      <Text
                        style={[heroStyles.sideCardTitle, { color: dt.text }]}
                        numberOfLines={2}
                      >
                        {secondFact
                          ? secondFact.length > 30
                            ? secondFact.substring(0, 30) + "..."
                            : secondFact
                          : "Knowledge Base"}
                      </Text>
                      <Text
                        style={[
                          heroStyles.sideCardDesc,
                          { color: dt.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {secondFact
                          ? secondFact.substring(0, 60)
                          : "Add more facts to build your study archive."}
                      </Text>
                    </View>
                    <View
                      style={[
                        heroStyles.sideCardFooter,
                        { borderTopColor: dt.secondary + "15" },
                      ]}
                    >
                      <Text
                        style={[
                          heroStyles.sideCardFooterLabel,
                          { color: dt.secondary },
                        ]}
                      >
                        STUDY ASSET
                      </Text>
                      <Text
                        style={[
                          heroStyles.sideCardFooterIcon,
                          { color: dt.secondary },
                        ]}
                      >
                        →
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── Add New Fact ── */}
            <View
              style={[
                inputStyles.card,
                { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
              ]}
            >
              <Text style={[inputStyles.label, { color: dt.textSecondary }]}>
                ✨ Add New Fact
              </Text>
              <View style={inputStyles.row}>
                <TextInput
                  style={[
                    inputStyles.input,
                    { backgroundColor: dt.surfaceLow, color: dt.text },
                  ]}
                  value={newFact}
                  onChangeText={setNewFact}
                  placeholder="Type a key fact to remember..."
                  placeholderTextColor={dt.outlineVariant}
                  onSubmitEditing={handleAddFact}
                  returnKeyType="done"
                  multiline
                  maxLength={200}
                />
                <Pressable
                  onPress={handleAddFact}
                  disabled={!newFact.trim()}
                  style={[
                    inputStyles.addBtn,
                    { backgroundColor: dt.primary, shadowColor: dt.primary },
                    !newFact.trim() && { opacity: 0.5 },
                  ]}
                >
                  <Text style={inputStyles.addBtnText}>+</Text>
                </Pressable>
              </View>
              <Text
                style={[inputStyles.charCount, { color: dt.textSecondary }]}
              >
                {newFact.length}/200
              </Text>
            </View>

            {/* ── Storage Card ── */}
            <View
              style={[
                storageStyles.card,
                { backgroundColor: dt.tertiaryContainer },
              ]}
            >
              <View style={storageStyles.cardLeft}>
                <Text
                  style={[
                    storageStyles.cardTitle,
                    { color: dt.onTertiaryContainer },
                  ]}
                >
                  Vault Storage: {Math.round(storagePercent)}% Full
                </Text>
                <Text
                  style={[
                    storageStyles.cardDesc,
                    { color: dt.onTertiaryContainer },
                  ]}
                >
                  {`You've saved ${totalStudyHours} worth of study data.`}
                </Text>
                {isFactMaster && (
                  <View
                    style={[
                      storageStyles.cardBtn,
                      { backgroundColor: dt.surfaceCard },
                    ]}
                  >
                    <Text
                      style={[
                        storageStyles.cardBtnText,
                        { color: dt.tertiary },
                      ]}
                    >
                      🏆 Fact Master
                    </Text>
                  </View>
                )}
              </View>
              <Text style={storageStyles.cardDecor}>☁️</Text>
            </View>

            {/* ── Browse All Vaults Section Header ── */}
            <View style={factStyles.section}>
              <View style={factStyles.sectionHeader}>
                <Text style={[factStyles.sectionTitle, { color: dt.text }]}>
                  Browse All Facts
                </Text>
                <View style={factStyles.filterRow}>
                  <Pressable
                    onPress={() => setActiveFilter("all")}
                    style={[
                      factStyles.filterPill,
                      {
                        backgroundColor:
                          activeFilter === "all"
                            ? dt.secondary
                            : dt.surfaceHigh,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        factStyles.filterPillText,
                        {
                          color:
                            activeFilter === "all"
                              ? dt.onSecondary
                              : dt.textSecondary,
                        },
                      ]}
                    >
                      All
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setActiveFilter("recent")}
                    style={[
                      factStyles.filterPill,
                      {
                        backgroundColor:
                          activeFilter === "recent"
                            ? dt.secondary
                            : dt.surfaceHigh,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        factStyles.filterPillText,
                        {
                          color:
                            activeFilter === "recent"
                              ? dt.onSecondary
                              : dt.textSecondary,
                        },
                      ]}
                    >
                      Recent
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={factStyles.emptyState}>
            <View
              style={[
                factStyles.emptyIcon,
                { backgroundColor: dt.primary + "15" },
              ]}
            >
              <MaterialCommunityIcons
                name="brain"
                size={36}
                color={dt.primary}
              />
            </View>
            <Text style={[factStyles.emptyTitle, { color: dt.text }]}>
              {searchQuery ? "No facts found" : "Your vault is empty"}
            </Text>
            <Text
              style={[factStyles.emptySubtitle, { color: dt.textSecondary }]}
            >
              {searchQuery
                ? "Try a different search term"
                : "Save key facts during study for quick revision later."}
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredFacts.length > 0 ? (
            <Text style={[factStyles.hint, { color: dt.textSecondary }]}>
              ← Swipe left to delete
            </Text>
          ) : null
        }
      />
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        factContent={alertConfig.factContent}
        icon={alertConfig.icon}
        iconName={alertConfig.iconName}
        buttons={alertConfig.buttons}
        onDismiss={dismissAlert}
      />
    </GestureHandlerRootView>
  );
}
