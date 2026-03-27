import {
  useAppStore,
  useLeaderboardStore,
  useProfileStore,
  useWeekStore,
} from "@/src/stores";
import { ALL_BADGES } from "@/src/utils/constants";
import { extractMostStudiedCourse } from "@/src/utils/courseParser";
import { minutesToHrs, durationMinutes } from "@/src/utils/time";
import {
  computeStreak,
  computeLevel,
  computeWeekTotals,
} from "@/src/utils/badges";
import { ProfileSyncService } from "@/src/services/profileSync";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAchievementsStore } from "@/src/stores/useAchievementsStore";
import { getUnlockedCount, getTotalPoints } from "@/src/utils/achievements";
import Toast from "react-native-toast-message";
import AchievementsModal from "@/components/AchievementsModal";
import CustomAlert, { type AlertButton } from "@/components/CustomAlert";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  type DimensionValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user, signOut } = useAuth();
  const { profile, setProfile } = useProfileStore();
  const { earnedBadges, archives, cumulativeMinutes, goalMins } = useAppStore();
  const { week } = useWeekStore();
  const { getUserRank } = useLeaderboardStore();
  const { achievements } = useAchievementsStore();

  const syncTimeoutRef = useRef<number | null>(null);
  const userRank = getUserRank(profile.name);
  const [achievementsVisible, setAchievementsVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    icon?: string;
    buttons?: AlertButton[];
  }>({ visible: false, title: "" });

  const dismissAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Computed values
  const totals = computeWeekTotals(week, goalMins);
  const streak = computeStreak(week);
  const { level, xp, levelPct } = computeLevel(
    cumulativeMinutes + totals.total,
  );
  const totalHours = Math.floor((cumulativeMinutes + totals.total) / 60);
  const totalPoints = getTotalPoints(achievements);
  const achievementUnlocked = getUnlockedCount(achievements);
  const totalAchievements = achievements.length;
  const xpToNext = 300 - xp;

  // Weekly heatmap data
  const weeklyMinutes = useMemo(() => {
    return week.map((day) => {
      return (
        durationMinutes(day.st1.start, day.st1.stop) +
        durationMinutes(day.st2.start, day.st2.stop) +
        durationMinutes(day.st3.start, day.st3.stop)
      );
    });
  }, [week]);

  const maxDayMinutes = Math.max(...weeklyMinutes, 1);

  // Top 3 earned badges to display as "Ethereal Badges"
  const displayBadges = useMemo(() => {
    const earned = ALL_BADGES.filter((b) => earnedBadges.includes(b.id));
    const locked = ALL_BADGES.filter((b) => !earnedBadges.includes(b.id));
    return [...earned, ...locked].slice(0, 6);
  }, [earnedBadges]);

  // Design tokens (consistent with board screen)
  const dt = useMemo(
    () => ({
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
    }),
    [isDark],
  );

  const handleSignOut = async () => {
    setAlertConfig({
      visible: true,
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      icon: "👋",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setSigningOut(true);
            try {
              const { error } = await signOut();
              if (error) {
                Toast.show({
                  type: "error",
                  text1: "Sign Out Failed",
                  text2: error.message,
                  position: "top",
                  visibilityTime: 3000,
                });
              }
            } catch (_err) {
              Toast.show({
                type: "error",
                text1: "Sign Out Failed",
                text2: "An unexpected error occurred",
                position: "top",
                visibilityTime: 3000,
              });
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    });
  };

  const syncProfileToSupabase = useCallback(
    (updates: Partial<typeof profile>) => {
      if (!user?.id) return;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(async () => {
        const dbUpdates: Record<string, string | undefined> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.faculty !== undefined) dbUpdates.faculty = updates.faculty;
        if (updates.department !== undefined)
          dbUpdates.department = updates.department;
        if (updates.level !== undefined) dbUpdates.level = updates.level;
        if (updates.accountabilityPartner !== undefined)
          dbUpdates.accountability_partner = updates.accountabilityPartner;
        const { error } = await ProfileSyncService.updateProfile(
          user.id,
          dbUpdates,
        );
        if (error) {
          console.error("Failed to sync profile:", error);
        }
      }, 1000);
    },
    [user],
  );

  const handleArchiveWeek = useCallback(() => {
    const { addArchive, addCumulativeMinutes } = useAppStore.getState();
    const { week: currentWeek, resetWeek } = useWeekStore.getState();

    const total = currentWeek.reduce((sum, d) => {
      return (
        sum +
        durationMinutes(d.st1.start, d.st1.stop) +
        durationMinutes(d.st2.start, d.st2.stop) +
        durationMinutes(d.st3.start, d.st3.stop)
      );
    }, 0);

    if (total === 0) {
      setAlertConfig({
        visible: true,
        title: "No Data",
        message: "No study sessions to archive this week.",
        icon: "📭",
        buttons: [{ text: "OK", style: "default" }],
      });
      return;
    }

    const topic = extractMostStudiedCourse(currentWeek);
    const rank = userRank;

    addArchive({ total, topic, rank, badges: earnedBadges });
    addCumulativeMinutes(total);
    resetWeek();

    setAlertConfig({
      visible: true,
      title: "Week Archived!",
      message: "Your week has been saved to the archive.",
      icon: "🏆",
      buttons: [{ text: "Nice!", style: "default" }],
    });
  }, [earnedBadges, userRank]);

  const renderField = (
    label: string,
    value: string,
    fieldKey: string,
    placeholder: string,
    onChangeText: (text: string) => void,
  ) => {
    const isEditing = editingField === fieldKey;
    return (
      <View style={s.fieldRow}>
        <Text style={[s.fieldLabel, { color: dt.textSecondary }]}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={[
              s.fieldInput,
              { backgroundColor: dt.surfaceLow, color: dt.text },
            ]}
            value={value}
            onChangeText={onChangeText}
            onBlur={() => setEditingField(null)}
            placeholder={placeholder}
            placeholderTextColor={dt.outlineVariant}
            autoFocus
          />
        ) : (
          <Pressable onPress={() => setEditingField(fieldKey)}>
            <View style={[s.fieldValueRow, { backgroundColor: dt.surfaceLow }]}>
              <Text
                style={[
                  s.fieldValue,
                  { color: value ? dt.text : dt.outlineVariant },
                ]}
                numberOfLines={1}
              >
                {value || placeholder}
              </Text>
              <Text style={[s.fieldEditIcon, { color: dt.outlineVariant }]}>
                ✏️
              </Text>
            </View>
          </Pressable>
        )}
      </View>
    );
  };

  // Determine elite label
  const eliteLabel =
    level >= 10
      ? "Elite Student"
      : level >= 5
        ? "Advanced Learner"
        : level >= 3
          ? "Rising Scholar"
          : "Student";

  return (
    <View style={[s.container, { backgroundColor: dt.bg }]}>
      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: insets.top + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View
              style={[s.headerAvatarWrap, { borderColor: dt.primaryContainer }]}
            >
              <Text style={s.headerAvatarText}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : "👤"}
              </Text>
              <View
                style={[
                  s.headerAvatarBadge,
                  { backgroundColor: dt.tertiaryContainer, borderColor: dt.bg },
                ]}
              >
                <Text style={s.headerAvatarBadgeIcon}>🏅</Text>
              </View>
            </View>
            <Text style={[s.headerTitle, { color: dt.primary }]}>
              FocusFlow
            </Text>
          </View>
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            style={({ pressed }) => [
              s.signOutBtn,
              {
                backgroundColor: dt.error + "12",
                opacity: signingOut ? 0.5 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[s.signOutBtnText, { color: dt.error }]}>
              {signingOut ? "..." : "Sign Out"}
            </Text>
          </Pressable>
        </View>

        {/* ─── Hero Profile Section ─── */}
        <View style={s.heroSection}>
          <View style={s.heroLeft}>
            <Text style={[s.heroLabel, { color: dt.secondary }]}>
              {eliteLabel}
            </Text>
            <Text style={[s.heroName, { color: dt.text }]}>
              {profile.name || "Student"}
            </Text>
            <Text style={[s.heroDesc, { color: dt.textSecondary }]}>
              {profile.faculty && profile.department
                ? `${profile.faculty} \u2022 ${profile.department}`
                : profile.faculty ||
                  profile.department ||
                  "Set your profile details below"}
              {profile.level ? ` \u2022 ${profile.level}` : ""}
            </Text>
          </View>
          <View style={s.heroStats}>
            <View style={[s.heroStatCard, { backgroundColor: dt.surfaceLow }]}>
              <Text style={[s.heroStatValue, { color: dt.primary }]}>
                {streak}
              </Text>
              <Text style={[s.heroStatLabel, { color: dt.textSecondary }]}>
                DAY STREAK
              </Text>
            </View>
            <View style={[s.heroStatCard, { backgroundColor: dt.surfaceLow }]}>
              <Text style={[s.heroStatValue, { color: dt.secondary }]}>
                {totalHours}
              </Text>
              <Text style={[s.heroStatLabel, { color: dt.textSecondary }]}>
                HOURS
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Bento Grid ─── */}
        <View style={s.bentoGrid}>
          {/* Left Column */}
          <View style={s.bentoLeft}>
            {/* Ethereal Badges */}
            <View
              style={[
                s.bentoCard,
                { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
              ]}
            >
              <View style={s.bentoCardHeader}>
                <Text style={[s.bentoCardTitle, { color: dt.text }]}>
                  Ethereal Badges
                </Text>
                <Pressable onPress={() => setAchievementsVisible(true)}>
                  <Text style={[s.bentoCardLink, { color: dt.primary }]}>
                    View All
                  </Text>
                </Pressable>
              </View>
              <View style={s.badgesGrid}>
                {displayBadges.map((badge) => {
                  const isUnlocked = earnedBadges.includes(badge.id);
                  return (
                    <View key={badge.id} style={s.badgeItem}>
                      <View
                        style={[
                          s.badgeCircle,
                          isUnlocked
                            ? { backgroundColor: dt.primaryContainer }
                            : { backgroundColor: dt.surfaceHigh, opacity: 0.5 },
                        ]}
                      >
                        <Text style={s.badgeEmoji}>{badge.icon}</Text>
                      </View>
                      <Text
                        style={[s.badgeName, { color: dt.text }]}
                        numberOfLines={1}
                      >
                        {badge.label}
                      </Text>
                      <Text style={[s.badgeLevel, { color: dt.textSecondary }]}>
                        {isUnlocked ? "Unlocked" : "Locked"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* XP Gauge */}
            <View style={[s.xpCard, { backgroundColor: dt.surfaceLow }]}>
              <View style={s.xpHeader}>
                <Text style={[s.xpHeaderTitle, { color: dt.text }]}>
                  Next Level Progress
                </Text>
                <Text style={[s.xpHeaderValue, { color: dt.tertiary }]}>
                  {xp} / 300 XP
                </Text>
              </View>
              <View
                style={[s.xpBarBg, { backgroundColor: dt.tertiaryContainer }]}
              >
                <View
                  style={[
                    s.xpBarFill,
                    {
                      backgroundColor: dt.tertiary,
                      width: `${levelPct}%` as DimensionValue,
                    },
                  ]}
                />
              </View>
              <Text style={[s.xpSubtext, { color: dt.textSecondary }]}>
                Only {xpToNext} XP left to reach{" "}
                <Text style={{ fontWeight: "700", color: dt.primary }}>
                  Level {level + 1}
                </Text>
              </Text>
            </View>
          </View>

          {/* Right Column */}
          <View style={s.bentoRight}>
            {/* Archive Vault */}
            <View
              style={[
                s.bentoCard,
                {
                  backgroundColor: dt.surfaceCard,
                  shadowColor: dt.shadow,
                  overflow: "hidden",
                },
              ]}
            >
              {/* Decorative glow */}
              <View
                style={[
                  s.archiveGlow,
                  { backgroundColor: dt.secondary + "08" },
                ]}
              />
              <Text
                style={[s.bentoCardTitle, { color: dt.text, marginBottom: 16 }]}
              >
                Archive Vault
              </Text>
              {archives.length > 0 ? (
                <View style={s.archiveList}>
                  {archives.slice(0, 3).map((archive, index) => (
                    <View
                      key={archive.id}
                      style={[
                        s.archiveRow,
                        { backgroundColor: dt.surfaceLow + "60" },
                      ]}
                    >
                      <View
                        style={[
                          s.archiveIconWrap,
                          {
                            backgroundColor:
                              index === 0
                                ? dt.primaryContainer + "30"
                                : dt.secondaryContainer + "30",
                          },
                        ]}
                      >
                        <Text style={s.archiveIconEmoji}>
                          {index === 0 ? "📄" : "📁"}
                        </Text>
                      </View>
                      <View style={s.archiveInfo}>
                        <Text style={[s.archiveTitle, { color: dt.text }]}>
                          {archive.topic || `Season ${archives.length - index}`}
                        </Text>
                        <Text
                          style={[s.archiveDate, { color: dt.textSecondary }]}
                        >
                          {minutesToHrs(archive.total)} \u2022{" "}
                          {new Date(archive.id).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                      {archive.rank > 0 && archive.rank <= 3 && (
                        <Text style={s.archiveMedal}>
                          {["🥇", "🥈", "🥉"][archive.rank - 1]}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[s.archiveEmpty, { color: dt.textSecondary }]}>
                  No archives yet. Complete a week and archive it!
                </Text>
              )}
              <Pressable
                onPress={handleArchiveWeek}
                style={({ pressed }) => [
                  s.archiveButton,
                  {
                    backgroundColor: dt.surfaceHigh,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[s.archiveButtonText, { color: dt.text }]}>
                  📦 Archive This Week
                </Text>
              </Pressable>
            </View>

            {/* Customize / Summary Card */}
            <View style={[s.customizeCard, { backgroundColor: dt.primary }]}>
              <Text style={s.customizeEmoji}>✨</Text>
              <Text style={[s.customizeTitle, { color: dt.onPrimary }]}>
                Your Journey
              </Text>
              <Text style={[s.customizeDesc, { color: dt.onPrimary + "cc" }]}>
                {totalPoints} points earned across {achievementUnlocked}/
                {totalAchievements} achievements. Keep pushing!
              </Text>
              <Pressable
                onPress={() => setAchievementsVisible(true)}
                style={({ pressed }) => [
                  s.customizeBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[s.customizeBtnText, { color: dt.primary }]}>
                  🏆 View Achievements
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ─── Focus Intensity Heatmap ─── */}
        <View
          style={[
            s.heatmapCard,
            { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
          ]}
        >
          <Text style={[s.heatmapTitle, { color: dt.text }]}>
            Focus Intensity Map
          </Text>
          <View style={s.heatmapBars}>
            {weeklyMinutes.map((mins, index) => {
              const pct = maxDayMinutes > 0 ? (mins / maxDayMinutes) * 100 : 0;
              const barColor =
                pct >= 80
                  ? dt.primary
                  : pct >= 50
                    ? dt.secondary
                    : pct >= 30
                      ? dt.primaryContainer
                      : pct > 0
                        ? dt.tertiaryContainer
                        : dt.surfaceLow;
              return (
                <View key={index} style={s.heatmapBarCol}>
                  <View
                    style={[s.heatmapBarBg, { backgroundColor: dt.surfaceLow }]}
                  >
                    <View
                      style={[
                        s.heatmapBarFill,
                        {
                          height: `${Math.max(pct, 4)}%` as DimensionValue,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[s.heatmapDayLabel, { color: dt.textSecondary }]}
                  >
                    {DAYS_SHORT[index]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── Edit Profile Fields ─── */}
        <View
          style={[
            s.fieldsCard,
            { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
          ]}
        >
          <Text style={[s.fieldsCardTitle, { color: dt.text }]}>
            Profile Details
          </Text>
          {renderField(
            "Full Name",
            profile.name,
            "name",
            "Enter your name",
            (text) => {
              setProfile({ name: text });
              syncProfileToSupabase({ name: text });
            },
          )}
          {renderField(
            "Faculty",
            profile.faculty,
            "faculty",
            "e.g., Sciences",
            (text) => {
              setProfile({ faculty: text });
              syncProfileToSupabase({ faculty: text });
            },
          )}
          {renderField(
            "Department",
            profile.department,
            "department",
            "e.g., Chemistry",
            (text) => {
              setProfile({ department: text });
              syncProfileToSupabase({ department: text });
            },
          )}
          {renderField(
            "Level",
            profile.level,
            "level",
            "e.g., 200L",
            (text) => {
              setProfile({ level: text });
              syncProfileToSupabase({ level: text });
            },
          )}
          {renderField(
            "Study Buddy",
            profile.accountabilityPartner,
            "partner",
            "Your accountability partner",
            (text) => {
              setProfile({ accountabilityPartner: text });
              syncProfileToSupabase({ accountabilityPartner: text });
            },
          )}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AchievementsModal
        visible={achievementsVisible}
        onClose={() => setAchievementsVisible(false)}
      />
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        buttons={alertConfig.buttons}
        onDismiss={dismissAlert}
      />
    </View>
  );
}

/* ─── Styles (split to avoid TS inference limit) ─── */

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(154, 195, 255, 0.15)",
    position: "relative",
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerAvatarBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarBadgeIcon: {
    fontSize: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Hero
  heroSection: {
    marginBottom: 28,
  },
  heroLeft: {
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroName: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: "row",
    gap: 14,
  },
  heroStatCard: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    minWidth: 110,
  },
  heroStatValue: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
});

const bentoStyles = StyleSheet.create({
  // Bento Grid
  bentoGrid: {
    gap: 16,
    marginBottom: 20,
  },
  bentoLeft: {
    gap: 16,
  },
  bentoRight: {
    gap: 16,
  },
  bentoCard: {
    borderRadius: 20,
    padding: 22,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
  },
  bentoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  bentoCardTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  bentoCardLink: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Badges
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  badgeItem: {
    alignItems: "center",
    width: "30%",
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeEmoji: {
    fontSize: 26,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  badgeLevel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },

  // XP Card
  xpCard: {
    borderRadius: 20,
    padding: 22,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  xpHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  xpHeaderValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  xpBarBg: {
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    marginBottom: 12,
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 7,
  },
  xpSubtext: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});

const archiveStyles = StyleSheet.create({
  // Archive Vault
  archiveGlow: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  archiveList: {
    gap: 10,
    marginBottom: 16,
  },
  archiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
  },
  archiveIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  archiveIconEmoji: {
    fontSize: 18,
  },
  archiveInfo: {
    flex: 1,
  },
  archiveTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  archiveDate: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 2,
  },
  archiveMedal: {
    fontSize: 18,
  },
  archiveEmpty: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 16,
  },
  archiveButton: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 4,
  },
  archiveButtonText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Customize Card
  customizeCard: {
    borderRadius: 20,
    padding: 22,
  },
  customizeEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  customizeTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
  },
  customizeDesc: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginBottom: 18,
  },
  customizeBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 28,
    alignSelf: "flex-start",
  },
  customizeBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
});

const detailStyles = StyleSheet.create({
  // Heatmap
  heatmapCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
  },
  heatmapTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  heatmapBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    height: 120,
  },
  heatmapBarCol: {
    flex: 1,
    alignItems: "center",
  },
  heatmapBarBg: {
    flex: 1,
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heatmapBarFill: {
    width: "100%",
    borderRadius: 999,
  },
  heatmapDayLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },

  // Fields Card
  fieldsCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
  },
  fieldsCardTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  fieldInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  fieldValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  fieldEditIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
});

const s = {
  ...baseStyles,
  ...bentoStyles,
  ...archiveStyles,
  ...detailStyles,
};
