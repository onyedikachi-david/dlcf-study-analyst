import { useAppStore, useWeekStore } from "@/src/stores";
import { Colors } from "@/src/theme/colors";
import { durationMinutes, minutesToHrs } from "@/src/utils/time";
import { extractMostStudiedCourse } from "@/src/utils/courseParser";
import React, { useMemo } from "react";
import {
  DimensionValue,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { week } = useWeekStore();
  const { cumulativeMinutes, earnedBadges, archives } = useAppStore();

  const weeklyData = useMemo(() => {
    return week.map((day, index) => {
      const total =
        durationMinutes(day.st1.start, day.st1.stop) +
        durationMinutes(day.st2.start, day.st2.stop) +
        durationMinutes(day.st3.start, day.st3.stop);
      return {
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index],
        minutes: total,
        hours: total / 60,
      };
    });
  }, [week]);

  const totalWeekMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const avgDailyMinutes = totalWeekMinutes / 7;
  const studyDays = weeklyData.filter((d) => d.minutes > 0).length;
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      if (weeklyData[i].minutes > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [weeklyData]);

  const mostStudiedTopic = extractMostStudiedCourse(week);

  const usrDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0, 0];
    week.forEach((day) => {
      if (day.usr >= 0 && day.usr <= 5) {
        dist[day.usr]++;
      }
    });
    return [
      { label: "😫", value: dist[0], color: "#ef4444" },
      { label: "😕", value: dist[1], color: "#f97316" },
      { label: "😐", value: dist[2], color: "#eab308" },
      { label: "🙂", value: dist[3], color: "#84cc16" },
      { label: "😊", value: dist[4], color: "#22c55e" },
      { label: "🤩", value: dist[5], color: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [week]);

  const totalLifetimeMinutes = cumulativeMinutes + totalWeekMinutes;
  const totalArchives = archives.length;
  const avgArchiveMinutes =
    totalArchives > 0
      ? archives.reduce((sum, a) => sum + a.total, 0) / totalArchives
      : 0;

  const sessionDistribution = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;

    week.forEach((day) => {
      [day.st1, day.st2, day.st3].forEach((session) => {
        if (session.start && session.stop) {
          const hour = parseInt(session.start.split(":")[0]);
          if (hour < 12) morning++;
          else if (hour < 17) afternoon++;
          else evening++;
        }
      });
    });

    return [
      { period: "Morning", count: morning, emoji: "🌅" },
      { period: "Afternoon", count: afternoon, emoji: "☀️" },
      { period: "Evening", count: evening, emoji: "🌙" },
    ];
  }, [week]);

  const bestDay = useMemo(() => {
    let maxMinutes = 0;
    let bestDayName = "None";
    weeklyData.forEach((day) => {
      if (day.minutes > maxMinutes) {
        maxMinutes = day.minutes;
        bestDayName = day.day;
      }
    });
    return { name: bestDayName, minutes: maxMinutes };
  }, [weeklyData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>
              📊 Analytics
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Your study insights
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.metricEmoji}>⏱️</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {minutesToHrs(totalWeekMinutes)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              This Week
            </Text>
          </View>

          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.metricEmoji}>📅</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {studyDays}/7
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Days Active
            </Text>
          </View>

          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.metricEmoji}>🔥</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Day Streak
            </Text>
          </View>

          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.metricEmoji}>⭐</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {earnedBadges.length}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Badges
            </Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            📈 Weekly Breakdown
          </Text>
          <View style={styles.simpleChart}>
            {weeklyData.map((day) => (
              <View key={day.day} style={styles.chartBar}>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        backgroundColor: colors.primary,
                        height: (Math.min((day.hours / 8) * 100, 100) +
                          "%") as DimensionValue,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, { color: colors.text }]}>
                  {day.day}
                </Text>
                <Text
                  style={[styles.chartValue, { color: colors.textSecondary }]}
                >
                  {day.hours.toFixed(1)}h
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Average Daily
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {minutesToHrs(avgDailyMinutes)}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Best Day
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {bestDay.name}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
              {minutesToHrs(bestDay.minutes)}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Lifetime
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {minutesToHrs(totalLifetimeMinutes)}
            </Text>
          </View>
        </View>

        {/* Session Distribution */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            ⏰ Study Time Distribution
          </Text>
          <View style={styles.distributionList}>
            {sessionDistribution.map((item) => {
              const total = sessionDistribution.reduce(
                (sum, i) => sum + i.count,
                0,
              );
              const percentage =
                total > 0 ? ((item.count / total) * 100).toFixed(0) : "0";
              return (
                <View key={item.period} style={styles.distributionItem}>
                  <View style={styles.distributionLeft}>
                    <Text style={styles.distributionEmoji}>{item.emoji}</Text>
                    <Text
                      style={[styles.distributionLabel, { color: colors.text }]}
                    >
                      {item.period}
                    </Text>
                  </View>
                  <View style={styles.distributionRight}>
                    <View
                      style={[
                        styles.distributionBar,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <View
                        style={[
                          styles.distributionBarFill,
                          {
                            backgroundColor: colors.primary,
                            width: (percentage + "%") as DimensionValue,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.distributionCount,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* USR Distribution */}
        {usrDistribution.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              😊 Self-Rating Distribution
            </Text>
            <View style={styles.usrList}>
              {usrDistribution.map((item, index) => (
                <View key={index} style={styles.usrItem}>
                  <Text style={styles.usrEmoji}>{item.label}</Text>
                  <View style={styles.usrInfo}>
                    <View
                      style={[
                        styles.usrBar,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <View
                        style={[
                          styles.usrBarFill,
                          {
                            backgroundColor: item.color,
                            width: ((item.value / 7) * 100 +
                              "%") as DimensionValue,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.usrCount, { color: colors.textSecondary }]}
                    >
                      {item.value} days
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Topic Focus */}
        {mostStudiedTopic && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              🎯 Most Studied Topic
            </Text>
            <View style={styles.topicFocus}>
              <Text style={[styles.topicName, { color: colors.primary }]}>
                {mostStudiedTopic}
              </Text>
              <Text
                style={[styles.topicSubtext, { color: colors.textSecondary }]}
              >
                Keep up the great focus!
              </Text>
            </View>
          </View>
        )}

        {/* Archive Stats */}
        {totalArchives > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              📚 Historical Performance
            </Text>
            <View style={styles.archiveStats}>
              <View style={styles.archiveStat}>
                <Text style={[styles.archiveValue, { color: colors.text }]}>
                  {totalArchives}
                </Text>
                <Text
                  style={[styles.archiveLabel, { color: colors.textSecondary }]}
                >
                  Weeks Archived
                </Text>
              </View>
              <View style={styles.archiveStat}>
                <Text style={[styles.archiveValue, { color: colors.text }]}>
                  {minutesToHrs(avgArchiveMinutes)}
                </Text>
                <Text
                  style={[styles.archiveLabel, { color: colors.textSecondary }]}
                >
                  Avg per Week
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Personal Record */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            🏆 Your Records
          </Text>
          <View style={styles.recordsList}>
            <View style={styles.recordItem}>
              <Text style={styles.recordEmoji}>💎</Text>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: colors.text }]}>
                  Longest Streak
                </Text>
                <Text
                  style={[styles.recordValue, { color: colors.textSecondary }]}
                >
                  {currentStreak} days
                </Text>
              </View>
            </View>
            <View style={styles.recordItem}>
              <Text style={styles.recordEmoji}>🎓</Text>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: colors.text }]}>
                  Total Study Time
                </Text>
                <Text
                  style={[styles.recordValue, { color: colors.textSecondary }]}
                >
                  {minutesToHrs(totalLifetimeMinutes)}
                </Text>
              </View>
            </View>
            <View style={styles.recordItem}>
              <Text style={styles.recordEmoji}>⚡</Text>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: colors.text }]}>
                  Best Single Day
                </Text>
                <Text
                  style={[styles.recordValue, { color: colors.textSecondary }]}
                >
                  {minutesToHrs(bestDay.minutes)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  },
  brand: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  metricEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Card
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: -0.3,
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
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statSubtext: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },

  // Distribution
  distributionList: {
    gap: 16,
  },
  distributionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distributionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  distributionEmoji: {
    fontSize: 20,
  },
  distributionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  distributionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginLeft: 20,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  distributionBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 14,
    fontWeight: "700",
    width: 30,
    textAlign: "right",
  },

  // Simple Chart
  simpleChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 180,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  chartBarContainer: {
    flex: 1,
    width: "70%",
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 6,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  chartValue: {
    fontSize: 10,
    fontWeight: "600",
  },

  // USR List
  usrList: {
    gap: 16,
  },
  usrItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  usrEmoji: {
    fontSize: 24,
  },
  usrInfo: {
    flex: 1,
    gap: 6,
  },
  usrBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  usrBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  usrCount: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Topic Focus
  topicFocus: {
    alignItems: "center",
    paddingVertical: 20,
  },
  topicName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  topicSubtext: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Archive Stats
  archiveStats: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "center",
  },
  archiveStat: {
    alignItems: "center",
  },
  archiveValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  archiveLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Records
  recordsList: {
    gap: 16,
  },
  recordItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  recordEmoji: {
    fontSize: 32,
  },
  recordInfo: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 13,
    fontWeight: "500",
  },

  bottomSpacer: {
    height: 20,
  },
});
