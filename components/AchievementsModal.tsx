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
import { Colors } from "@/src/theme/colors";
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
  const colors = isDark ? Colors.dark : Colors.light;

  const { achievements } = useAchievementsStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const totalPoints = getTotalPoints(achievements);
  const unlockedCount = getUnlockedCount(achievements);
  const totalCount = achievements.length;

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
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                🏆 Achievements
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {unlockedCount}/{totalCount} unlocked
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* Stats Bar */}
          <View
            style={[styles.statsBar, { backgroundColor: colors.surface }]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {totalPoints}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Points
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.background }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {unlockedCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Unlocked
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.background }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {((unlockedCount / totalCount) * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Complete
              </Text>
            </View>
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <Pressable
              onPress={() => setSelectedCategory("all")}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === "all"
                      ? colors.primary
                      : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color:
                      selectedCategory === "all" ? "#fff" : colors.text,
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
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === category.id
                        ? colors.primary
                        : colors.surface,
                  },
                ]}
              >
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color:
                        selectedCategory === category.id
                          ? "#fff"
                          : colors.text,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Achievements List */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  colors: any;
}

function AchievementCard({ achievement, colors }: AchievementCardProps) {
  const progress = getProgressPercentage(achievement);
  const rarityColor = getRarityColor(achievement.rarity);

  return (
    <View
      style={[
        styles.achievementCard,
        {
          backgroundColor: colors.surface,
          opacity: achievement.unlocked ? 1 : 0.6,
        },
      ]}
    >
      <View style={styles.achievementHeader}>
        <View style={styles.achievementIcon}>
          <Text style={styles.achievementIconText}>{achievement.icon}</Text>
          {achievement.unlocked && (
            <View style={styles.unlockedBadge}>
              <Text style={styles.unlockedBadgeText}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, { color: colors.text }]}>
            {achievement.title}
          </Text>
          <Text
            style={[
              styles.achievementDescription,
              { color: colors.textSecondary },
            ]}
          >
            {achievement.description}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {!achievement.unlocked && (
        <View style={styles.progressSection}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.progressText, { color: colors.textSecondary }]}
          >
            {achievement.progress} / {achievement.requirement}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.achievementFooter}>
        <View
          style={[
            styles.rarityBadge,
            { backgroundColor: rarityColor + "20" },
          ]}
        >
          <Text style={[styles.rarityText, { color: rarityColor }]}>
            {getRarityLabel(achievement.rarity)}
          </Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={[styles.pointsIcon, { color: colors.primary }]}>
            ⭐
          </Text>
          <Text style={[styles.pointsText, { color: colors.text }]}>
            {achievement.points}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6b7280",
  },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: "100%",
    marginHorizontal: 8,
  },

  // Category Filter
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
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
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },

  // Achievement Card
  achievementCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  achievementIcon: {
    position: "relative",
  },
  achievementIconText: {
    fontSize: 40,
  },
  unlockedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
  },
  unlockedBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "800",
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
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
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
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
    borderRadius: 8,
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
  pointsIcon: {
    fontSize: 14,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
