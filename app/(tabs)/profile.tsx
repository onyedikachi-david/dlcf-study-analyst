import {
  useAppStore,
  useLeaderboardStore,
  useProfileStore,
  useWeekStore,
} from "@/src/stores";
import { BadgeColors, Colors } from "@/src/theme/colors";
import { ALL_BADGES } from "@/src/utils/constants";
import { extractMostStudiedCourse } from "@/src/utils/courseParser";
import { minutesToHrs } from "@/src/utils/time";
import { ProfileSyncService } from "@/src/services/profileSync";
import { useAuth } from "@/src/contexts/AuthContext";
import Toast from "react-native-toast-message";
import AchievementsModal from "@/components/AchievementsModal";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { user, signOut } = useAuth();
  const { profile, setProfile } = useProfileStore();
  const { earnedBadges, archives, cumulativeMinutes } = useAppStore();
  const { week } = useWeekStore();
  const { getUserRank } = useLeaderboardStore();

  // Debounce timer for profile sync
  const syncTimeoutRef = useRef<number | null>(null);

  const unlockedCount = earnedBadges.length;
  const userRank = getUserRank(profile.name);
  const [achievementsVisible, setAchievementsVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
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
      { cancelable: true },
    );
  };

  // Debounced profile sync to Supabase
  const syncProfileToSupabase = useCallback(
    (updates: Partial<typeof profile>) => {
      if (!user?.id) return;

      // Clear existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Set new timeout to sync after 1 second of no changes
      syncTimeoutRef.current = setTimeout(async () => {
        const dbUpdates: any = {};
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
    const { week, resetWeek } = useWeekStore.getState();

    const total = week.reduce((sum, d) => {
      const dayMins =
        (d.st1.start && d.st1.stop ? 1 : 0) +
        (d.st2.start && d.st2.stop ? 1 : 0) +
        (d.st3.start && d.st3.stop ? 1 : 0);
      return sum + dayMins;
    }, 0);

    if (total === 0) {
      Alert.alert("No Data", "No study sessions to archive this week.");
      return;
    }

    const topic = extractMostStudiedCourse(week);
    const rank = userRank;

    addArchive({
      total,
      topic,
      rank,
      badges: earnedBadges,
    });

    addCumulativeMinutes(total);
    resetWeek();

    Alert.alert("Archived!", "Your week has been saved to the archive.");
  }, [earnedBadges, userRank]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>
              👤 Profile
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Your study identity
            </Text>
          </View>
          <View style={styles.headerRight}>
            {userRank > 0 && (
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text style={[styles.rankBadgeText, { color: colors.primary }]}>
                  #{userRank}
                </Text>
              </View>
            )}
            <Pressable
              onPress={handleSignOut}
              disabled={signingOut}
              style={[
                styles.signOutButton,
                { backgroundColor: colors.error + "15" },
                signingOut && { opacity: 0.5 },
              ]}
            >
              <Text style={[styles.signOutButtonText, { color: colors.error }]}>
                {signingOut ? "..." : "Sign Out"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarSection}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={styles.avatarEmoji}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : "👤"}
              </Text>
            </View>
            <Text style={[styles.avatarName, { color: colors.text }]}>
              {profile.name || "Student"}
            </Text>
            <Text style={[styles.avatarMeta, { color: colors.textSecondary }]}>
              {profile.faculty}
              {profile.faculty && profile.department ? " • " : ""}
              {profile.department}
            </Text>
          </View>

          <View style={styles.fieldsSection}>
            <View style={styles.fieldRow}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
                value={profile.name}
                onChangeText={(text) => {
                  setProfile({ name: text });
                  syncProfileToSupabase({ name: text });
                }}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.fieldRow}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Faculty
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
                value={profile.faculty}
                onChangeText={(text) => {
                  setProfile({ faculty: text });
                  syncProfileToSupabase({ faculty: text });
                }}
                placeholder="e.g., Sciences"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.fieldRow}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Department
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
                value={profile.department}
                onChangeText={(text) => {
                  setProfile({ department: text });
                  syncProfileToSupabase({ department: text });
                }}
                placeholder="e.g., Chemistry"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.fieldRow}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Level
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
                value={profile.level}
                onChangeText={(text) => {
                  setProfile({ level: text });
                  syncProfileToSupabase({ level: text });
                }}
                placeholder="e.g., 200L"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.fieldRow}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Study Buddy
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
                value={profile.accountabilityPartner}
                onChangeText={(text) => {
                  setProfile({ accountabilityPartner: text });
                  syncProfileToSupabase({ accountabilityPartner: text });
                }}
                placeholder="Your accountability partner"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {minutesToHrs(cumulativeMinutes)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Time
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {archives.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Weeks
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {unlockedCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Badges
            </Text>
          </View>
        </View>

        {/* Badges Card */}
        <View style={[styles.badgesCard, { backgroundColor: colors.surface }]}>
          <View style={styles.badgesHeader}>
            <Text style={[styles.badgesTitle, { color: colors.text }]}>
              Badges
            </Text>
            <View style={styles.badgesHeaderRight}>
              <View
                style={[
                  styles.badgesCount,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text
                  style={[styles.badgesCountText, { color: colors.primary }]}
                >
                  {unlockedCount}/{ALL_BADGES.length}
                </Text>
              </View>
              <Pressable
                onPress={() => setAchievementsVisible(true)}
                style={[
                  styles.achievementsButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.achievementsButtonText}>
                  🏆 Achievements
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.badgesGrid}>
            {ALL_BADGES.map((badge) => {
              const isUnlocked = earnedBadges.includes(badge.id);
              return (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeItem,
                    {
                      backgroundColor: isUnlocked
                        ? BadgeColors.unlocked.background
                        : BadgeColors.locked.background,
                      borderColor: isUnlocked
                        ? BadgeColors.unlocked.border
                        : BadgeColors.locked.border,
                      opacity: isUnlocked ? 1 : BadgeColors.locked.opacity,
                    },
                  ]}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text
                    style={[styles.badgeLabel, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {badge.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Past Seasons */}
        {archives.length > 0 && (
          <View
            style={[styles.seasonsCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.seasonsTitle, { color: colors.text }]}>
              📊 Past Seasons ({archives.length})
            </Text>
            <View style={styles.seasonsList}>
              {archives.slice(0, 5).map((archive, index) => (
                <View key={archive.id} style={styles.seasonRow}>
                  <View style={styles.seasonLeft}>
                    <Text style={[styles.seasonLabel, { color: colors.text }]}>
                      S{archives.length - index}
                    </Text>
                    <Text
                      style={[
                        styles.seasonDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {new Date(archive.id).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.seasonRight}>
                    <Text
                      style={[styles.seasonHours, { color: colors.primary }]}
                    >
                      {minutesToHrs(archive.total)}
                    </Text>
                    {archive.rank > 0 && archive.rank <= 3 ? (
                      <Text style={styles.seasonRank}>
                        {["🥇", "🥈", "🥉"][archive.rank - 1]}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Archive Button */}
        <Pressable
          onPress={handleArchiveWeek}
          style={[styles.archiveBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.archiveBtnEmoji}>📦</Text>
          <Text style={styles.archiveBtnText}>Archive This Week</Text>
        </Pressable>
      </ScrollView>

      <AchievementsModal
        visible={achievementsVisible}
        onClose={() => setAchievementsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Header
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  brand: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  rankBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signOutButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Profile Card
  profileCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 32,
    fontWeight: "800",
  },
  avatarName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  avatarMeta: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  fieldsSection: {
    gap: 16,
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  // Badges Card
  badgesCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  badgesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badgesHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  badgesCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgesCountText: {
    fontSize: 12,
    fontWeight: "700",
  },
  achievementsButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  achievementsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Seasons Card
  seasonsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  seasonsTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  seasonsList: {
    gap: 12,
  },
  seasonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  seasonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  seasonLabel: {
    fontSize: 16,
    fontWeight: "800",
    width: 36,
  },
  seasonDate: {
    fontSize: 13,
    fontWeight: "500",
  },
  seasonRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  seasonHours: {
    fontSize: 15,
    fontWeight: "700",
  },
  seasonRank: {
    fontSize: 20,
  },

  // Archive Button
  archiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  archiveBtnEmoji: {
    fontSize: 20,
  },
  archiveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
