import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAchievementsStore } from "@/src/stores/useAchievementsStore";
import {
  ACHIEVEMENT_CATEGORIES,
  getProgressPercentage,
  getTotalPoints,
  getUnlockedCount,
  getRarityColor,
  getRarityLabel,
  type Achievement,
} from "@/src/utils/achievements";

// ─── Design Token Interface ───────────────────────────────────────────────────

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

// ─── StyleSheets (declared before component functions) ───────────────────────

const headerStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    alignSelf: "center",
    marginHorizontal: 8,
  },

  // Category Filter
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
    paddingBottom: 12,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
    paddingBottom: 48,
  },
});

const cardStyles = StyleSheet.create({
  // Achievement Card
  achievementCard: {
    borderRadius: 22,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  achievementCardLocked: {
    borderWidth: 1.5,
  },
  achievementCardUnlocked: {
    borderLeftWidth: 4,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 12,
  },
  iconWrapper: {
    position: "relative",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementIconText: {
    fontSize: 28,
  },
  unlockedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockedBadgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "800",
  },
  achievementInfo: {
    flex: 1,
    paddingTop: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  achievementDescription: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  // Progress
  progressSection: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },

  // Footer
  achievementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pointsEmoji: {
    fontSize: 14,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

// Merge into single `s` object for convenience
const s = StyleSheet.create({ ...headerStyles, ...cardStyles });

// ─── AchievementCard Sub-component ───────────────────────────────────────────

interface AchievementCardProps {
  achievement: Achievement;
  dt: DesignTokens;
}

function AchievementCard({ achievement, dt }: AchievementCardProps) {
  const progress = getProgressPercentage(achievement);
  const rarityColor = getRarityColor(achievement.rarity);

  return (
    <View
      style={[
        s.achievementCard,
        { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
        achievement.unlocked
          ? [s.achievementCardUnlocked, { borderLeftColor: dt.secondary }]
          : [
              s.achievementCardLocked,
              { opacity: 0.55, borderColor: dt.outlineVariant },
            ],
      ]}
    >
      {/* Header row: icon + info */}
      <View style={s.achievementHeader}>
        {/* Icon circle */}
        <View style={s.iconWrapper}>
          <View
            style={[
              s.iconCircle,
              {
                backgroundColor: achievement.unlocked
                  ? dt.secondaryContainer
                  : dt.surfaceLow,
              },
            ]}
          >
            <Text style={s.achievementIconText}>{achievement.icon}</Text>
          </View>
          {achievement.unlocked && (
            <View style={[s.unlockedBadge, { backgroundColor: dt.secondary }]}>
              <Text style={s.unlockedBadgeText}>✓</Text>
            </View>
          )}
        </View>

        {/* Title + description */}
        <View style={s.achievementInfo}>
          <Text style={[s.achievementTitle, { color: dt.text }]}>
            {achievement.title}
          </Text>
          <Text style={[s.achievementDescription, { color: dt.textSecondary }]}>
            {achievement.description}
          </Text>
        </View>
      </View>

      {/* Progress Bar — locked only */}
      {!achievement.unlocked && (
        <View style={s.progressSection}>
          <View style={[s.progressTrack, { backgroundColor: dt.surfaceLow }]}>
            <View
              style={[
                s.progressFill,
                {
                  backgroundColor: dt.primary,
                  width: `${progress}%` as `${number}%`,
                },
              ]}
            />
          </View>
          <Text style={[s.progressText, { color: dt.textSecondary }]}>
            {achievement.progress} / {achievement.requirement}
          </Text>
        </View>
      )}

      {/* Footer: rarity badge + points */}
      <View style={s.achievementFooter}>
        <View style={[s.rarityBadge, { backgroundColor: rarityColor + "20" }]}>
          <Text style={[s.rarityText, { color: rarityColor }]}>
            {getRarityLabel(achievement.rarity)}
          </Text>
        </View>
        <View style={s.pointsBadge}>
          <Text style={[s.pointsEmoji, { color: dt.tertiary }]}>⭐</Text>
          <Text style={[s.pointsText, { color: dt.tertiary }]}>
            {achievement.points}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── AchievementsModal (main export) ─────────────────────────────────────────

interface AchievementsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AchievementsModal({
  visible,
  onClose,
}: AchievementsModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { achievements } = useAchievementsStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const totalPoints = getTotalPoints(achievements);
  const unlockedCount = getUnlockedCount(achievements);
  const totalCount = achievements.length;

  // ── Design tokens ──────────────────────────────────────────────────────────
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

  // ── Filtered & sorted achievements ────────────────────────────────────────
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") {
      return achievements;
    }
    return achievements.filter((a) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const sortedAchievements = useMemo(() => {
    return [...filteredAchievements].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      if (a.unlocked && b.unlocked) return 0;
      const aProgress = getProgressPercentage(a);
      const bProgress = getProgressPercentage(b);
      return bProgress - aProgress;
    });
  }, [filteredAchievements]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          s.container,
          { backgroundColor: dt.bg, paddingTop: insets.top },
        ]}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={[s.title, { color: dt.text }]}>🏆 Achievements</Text>
              <Text style={[s.subtitle, { color: dt.textSecondary }]}>
                {unlockedCount}/{totalCount} unlocked
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[s.closeButton, { backgroundColor: dt.surfaceMid }]}
            >
              <Text style={[s.closeIcon, { color: dt.text }]}>✕</Text>
            </Pressable>
          </View>

          {/* ── Stats Bar ──────────────────────────────────────────────────── */}
          <View
            style={[
              s.statsBar,
              { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            ]}
          >
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: dt.primary }]}>
                {totalPoints}
              </Text>
              <Text style={[s.statLabel, { color: dt.textSecondary }]}>
                Points
              </Text>
            </View>

            <View style={[s.statDivider, { backgroundColor: dt.outline }]} />

            <View style={s.statItem}>
              <Text style={[s.statValue, { color: dt.primary }]}>
                {unlockedCount}
              </Text>
              <Text style={[s.statLabel, { color: dt.textSecondary }]}>
                Unlocked
              </Text>
            </View>

            <View style={[s.statDivider, { backgroundColor: dt.outline }]} />

            <View style={s.statItem}>
              <Text style={[s.statValue, { color: dt.primary }]}>
                {((unlockedCount / totalCount) * 100).toFixed(0)}%
              </Text>
              <Text style={[s.statLabel, { color: dt.textSecondary }]}>
                Complete
              </Text>
            </View>
          </View>

          {/* ── Category Filter Chips ──────────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.categoryScroll}
          >
            <Pressable
              onPress={() => setSelectedCategory("all")}
              style={[
                s.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === "all" ? dt.primary : dt.surfaceLow,
                },
              ]}
            >
              <Text
                style={[
                  s.categoryChipText,
                  {
                    color: selectedCategory === "all" ? "#fff" : dt.text,
                  },
                ]}
              >
                All
              </Text>
            </Pressable>

            {ACHIEVEMENT_CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  s.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === category.id
                        ? dt.primary
                        : dt.surfaceLow,
                  },
                ]}
              >
                <Text style={s.categoryEmoji}>{category.icon}</Text>
                <Text
                  style={[
                    s.categoryChipText,
                    {
                      color:
                        selectedCategory === category.id ? "#fff" : dt.text,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Achievements List ───────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              dt={dt}
            />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
