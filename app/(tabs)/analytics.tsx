import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore, useWeekStore } from "@/src/stores";
import { durationMinutes, minutesToHrs } from "@/src/utils/time";
import { extractMostStudiedCourse } from "@/src/utils/courseParser";
import {
  computeStreak,
  computeLevel,
  computeWeekTotals,
} from "@/src/utils/badges";
import { useAchievementsStore } from "@/src/stores/useAchievementsStore";
import { getTotalPoints } from "@/src/utils/achievements";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type DimensionValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { week } = useWeekStore();
  const { cumulativeMinutes, archives, goalMins } = useAppStore();
  const { achievements } = useAchievementsStore();

  // Weekly data
  const weeklyData = useMemo(() => {
    return week.map((day, index) => {
      const total =
        durationMinutes(day.st1.start, day.st1.stop) +
        durationMinutes(day.st2.start, day.st2.stop) +
        durationMinutes(day.st3.start, day.st3.stop);
      return {
        day: DAYS_SHORT[index],
        minutes: total,
        hours: total / 60,
      };
    });
  }, [week]);

  const totalWeekMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const avgDailyMinutes = totalWeekMinutes / 7;
  const studyDays = weeklyData.filter((d) => d.minutes > 0).length;
  const maxDayMinutes = Math.max(...weeklyData.map((d) => d.minutes), 1);

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

  const streak = computeStreak(week);
  const totals = computeWeekTotals(week, goalMins);
  const { level, xp } = computeLevel(cumulativeMinutes + totals.total);
  const totalPoints = getTotalPoints(achievements);
  const totalLifetimeMinutes = cumulativeMinutes + totalWeekMinutes;
  const totalArchives = archives.length;
  const avgArchiveMinutes =
    totalArchives > 0
      ? archives.reduce((sum, a) => sum + a.total, 0) / totalArchives
      : 0;

  const mostStudiedTopic = extractMostStudiedCourse(week);

  // Focus score: composite of streak, study days, goal progress
  const goalProgress =
    goalMins > 0 ? Math.min(totalWeekMinutes / goalMins, 1) : 0;
  const focusScore = Math.min(
    100,
    Math.round(
      (studyDays / 7) * 30 + goalProgress * 40 + Math.min(streak / 7, 1) * 30,
    ),
  );

  // Session time distribution
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
      { period: "Morning", count: morning, icon: "weather-sunset-up" as const },
      {
        period: "Afternoon",
        count: afternoon,
        icon: "white-balance-sunny" as const,
      },
      { period: "Evening", count: evening, icon: "weather-night" as const },
    ];
  }, [week]);

  const totalSessions = sessionDistribution.reduce(
    (sum, i) => sum + i.count,
    0,
  );

  // Peak hours insight
  const peakPeriod = useMemo(() => {
    const sorted = [...sessionDistribution].sort((a, b) => b.count - a.count);
    return sorted[0];
  }, [sessionDistribution]);

  // Best day
  const bestDay = useMemo(() => {
    let maxMins = 0;
    let bestName = "None";
    weeklyData.forEach((day) => {
      if (day.minutes > maxMins) {
        maxMins = day.minutes;
        bestName = day.day;
      }
    });
    return { name: bestName, minutes: maxMins };
  }, [weeklyData]);

  // Average session length
  const avgSessionMinutes =
    totalSessions > 0 ? Math.round(totalWeekMinutes / totalSessions) : 0;

  // Subject mix from topics
  const subjectMix = useMemo(() => {
    const topics: Record<string, number> = {};
    week.forEach((day) => {
      if (day.topics) {
        const dayTotal =
          durationMinutes(day.st1.start, day.st1.stop) +
          durationMinutes(day.st2.start, day.st2.stop) +
          durationMinutes(day.st3.start, day.st3.stop);
        day.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((topic) => {
            topics[topic] = (topics[topic] || 0) + dayTotal;
          });
      }
    });
    return Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, mins]) => ({ name, minutes: mins }));
  }, [week]);

  // USR distribution
  const usrDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0, 0];
    week.forEach((day) => {
      if (day.usr >= 0 && day.usr <= 5) {
        dist[day.usr]++;
      }
    });
    return [
      {
        label: "1",
        icon: "emoticon-cry-outline" as const,
        value: dist[0],
        color: "#ef4444",
      },
      {
        label: "2",
        icon: "emoticon-sad-outline" as const,
        value: dist[1],
        color: "#f97316",
      },
      {
        label: "3",
        icon: "emoticon-neutral-outline" as const,
        value: dist[2],
        color: "#eab308",
      },
      {
        label: "4",
        icon: "emoticon-outline" as const,
        value: dist[3],
        color: "#84cc16",
      },
      {
        label: "5",
        icon: "emoticon-happy-outline" as const,
        value: dist[4],
        color: "#22c55e",
      },
      {
        label: "6",
        icon: "emoticon-excited-outline" as const,
        value: dist[5],
        color: "#10b981",
      },
    ].filter((d) => d.value > 0);
  }, [week]);

  // Design tokens
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

  // Improvement hint (compare current to last archive)
  const improvementPct = useMemo(() => {
    if (archives.length === 0) return null;
    const lastArchiveTotal = archives[0].total;
    if (lastArchiveTotal === 0) return null;
    const diff =
      ((totalWeekMinutes - lastArchiveTotal) / lastArchiveTotal) * 100;
    return Math.round(diff);
  }, [archives, totalWeekMinutes]);

  const subjectColors = [
    dt.primary,
    dt.secondary,
    dt.tertiary,
    dt.outlineVariant,
  ];

  return (
    <View style={[s.container, { backgroundColor: dt.bg }]}>
      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: insets.top + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.headerIcon, { backgroundColor: dt.surfaceHigh }]}>
              <MaterialCommunityIcons
                name="chart-bar"
                size={20}
                color={dt.primary}
              />
            </View>
            <Text style={[s.headerTitle, { color: dt.primary }]}>
              FocusFlow
            </Text>
          </View>
        </View>

        {/* ─── Hero Section ─── */}
        <View style={s.heroSection}>
          <View style={s.heroTextCol}>
            <Text style={[s.heroTitle, { color: dt.text }]}>
              Weekly Mastery
            </Text>
            <Text style={[s.heroDesc, { color: dt.textSecondary }]}>
              {improvementPct !== null
                ? improvementPct >= 0
                  ? `Your focus consistency improved by ${improvementPct}% compared to last week.`
                  : `Your focus dipped ${Math.abs(improvementPct)}% from last week. Time to bounce back!`
                : `Track your weekly study patterns and find your optimal rhythm.`}
            </Text>
          </View>
          <View
            style={[
              s.heroScoreCard,
              {
                backgroundColor: dt.surfaceCard,
                shadowColor: dt.shadow,
              },
            ]}
          >
            <View>
              <Text style={[s.heroScoreLabel, { color: dt.textSecondary }]}>
                FOCUS SCORE
              </Text>
              <Text style={[s.heroScoreValue, { color: dt.primary }]}>
                {focusScore}/100
              </Text>
            </View>
            <View
              style={[
                s.heroScoreIcon,
                { backgroundColor: dt.tertiaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={28}
                color={dt.tertiary}
              />
            </View>
          </View>
        </View>

        {/* ─── Main Chart Card: Study Breakdown ─── */}
        <View style={[s.chartCard, { backgroundColor: dt.surfaceLow }]}>
          <View style={s.chartCardHeader}>
            <Text style={[s.sectionTitle, { color: dt.text }]}>
              Study Breakdown
            </Text>
            <View style={[s.chartPill, { backgroundColor: dt.primary }]}>
              <Text style={[s.chartPillText, { color: dt.onPrimary }]}>
                Week
              </Text>
            </View>
          </View>

          <View style={s.chartBars}>
            {weeklyData.map((day, index) => {
              const pct =
                maxDayMinutes > 0 ? (day.minutes / maxDayMinutes) * 100 : 0;
              return (
                <View key={day.day} style={s.chartBarCol}>
                  <View
                    style={[
                      s.chartBarBg,
                      { backgroundColor: dt.primaryContainer + "30" },
                    ]}
                  >
                    <View
                      style={[
                        s.chartBarFill,
                        {
                          height: `${Math.max(pct, 3)}%` as DimensionValue,
                          backgroundColor: dt.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.chartDayLabel, { color: dt.textSecondary }]}>
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── Subject Mix ─── */}
        <View style={[s.subjectCard, { backgroundColor: dt.surfaceHighest }]}>
          <Text style={[s.sectionTitle, { color: dt.text }]}>Subject Mix</Text>
          {subjectMix.length > 0 ? (
            <View style={s.subjectList}>
              {subjectMix.map((item, index) => (
                <View key={item.name} style={s.subjectRow}>
                  <View style={s.subjectLeft}>
                    <View
                      style={[
                        s.subjectDot,
                        {
                          backgroundColor:
                            subjectColors[index % subjectColors.length],
                        },
                      ]}
                    />
                    <Text
                      style={[s.subjectName, { color: dt.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text style={[s.subjectHours, { color: dt.textSecondary }]}>
                    {minutesToHrs(item.minutes)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[s.emptyHint, { color: dt.textSecondary }]}>
              Add topics in the Tracker to see your subject breakdown.
            </Text>
          )}
        </View>

        {/* ─── Secondary Stats Grid ─── */}
        <View style={s.statsGrid}>
          {/* Streak Card */}
          <View
            style={[
              s.statCard,
              { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            ]}
          >
            <View style={s.statCardHeader}>
              <View
                style={[
                  s.statIconWrap,
                  { backgroundColor: dt.secondary + "15" },
                ]}
              >
                <MaterialCommunityIcons
                  name="fire"
                  size={22}
                  color={dt.error}
                />
              </View>
              <Text style={[s.statCardLabel, { color: dt.textSecondary }]}>
                DAILY STREAK
              </Text>
            </View>
            <Text style={[s.statCardValue, { color: dt.text }]}>
              {streak} {streak === 1 ? "Day" : "Days"}
            </Text>
            <Text style={[s.statCardHint, { color: dt.secondary }]}>
              {studyDays}/7 days active this week
            </Text>
          </View>

          {/* Avg Session Card */}
          <View
            style={[
              s.statCard,
              { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            ]}
          >
            <View style={s.statCardHeader}>
              <View
                style={[s.statIconWrap, { backgroundColor: dt.primary + "15" }]}
              >
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={22}
                  color={dt.secondary}
                />
              </View>
              <Text style={[s.statCardLabel, { color: dt.textSecondary }]}>
                AVG SESSION
              </Text>
            </View>
            <Text style={[s.statCardValue, { color: dt.text }]}>
              {avgSessionMinutes} Min
            </Text>
            <Text style={[s.statCardHint, { color: dt.primary }]}>
              {minutesToHrs(Math.round(avgDailyMinutes))} avg/day
            </Text>
          </View>

          {/* XP Card */}
          <View
            style={[
              s.statCard,
              { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            ]}
          >
            <View style={s.statCardHeader}>
              <View
                style={[
                  s.statIconWrap,
                  { backgroundColor: dt.tertiary + "15" },
                ]}
              >
                <MaterialCommunityIcons
                  name="star"
                  size={22}
                  color={dt.tertiary}
                />
              </View>
              <Text style={[s.statCardLabel, { color: dt.textSecondary }]}>
                XP GAINED
              </Text>
            </View>
            <Text style={[s.statCardValue, { color: dt.text }]}>
              {totalPoints > 0 ? totalPoints.toLocaleString() : xp}
            </Text>
            <Text style={[s.statCardHint, { color: dt.tertiary }]}>
              Level {level} Scholar
            </Text>
          </View>
        </View>

        {/* ─── Session Time Distribution ─── */}
        <View
          style={[
            s.card,
            { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
          ]}
        >
          <Text style={[s.sectionTitle, { color: dt.text }]}>
            Study Time Distribution
          </Text>
          <View style={s.distList}>
            {sessionDistribution.map((item) => {
              const pct =
                totalSessions > 0
                  ? ((item.count / totalSessions) * 100).toFixed(0)
                  : "0";
              return (
                <View key={item.period} style={s.distRow}>
                  <View style={s.distLeft}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={dt.primary}
                    />
                    <Text style={[s.distLabel, { color: dt.text }]}>
                      {item.period}
                    </Text>
                  </View>
                  <View style={s.distRight}>
                    <View
                      style={[s.distBarBg, { backgroundColor: dt.surfaceLow }]}
                    >
                      <View
                        style={[
                          s.distBarFill,
                          {
                            backgroundColor: dt.primary,
                            width: `${pct}%` as DimensionValue,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[s.distCount, { color: dt.textSecondary }]}>
                      {item.count}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── USR Distribution ─── */}
        {usrDistribution.length > 0 && (
          <View
            style={[
              s.card,
              { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            ]}
          >
            <Text style={[s.sectionTitle, { color: dt.text }]}>
              Self-Rating Distribution
            </Text>
            <View style={s.usrList}>
              {usrDistribution.map((item, index) => (
                <View key={index} style={s.usrRow}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={22}
                    color={item.color}
                  />
                  <View style={s.usrBarWrap}>
                    <View
                      style={[s.usrBarBg, { backgroundColor: dt.surfaceLow }]}
                    >
                      <View
                        style={[
                          s.usrBarFill,
                          {
                            backgroundColor: item.color,
                            width:
                              `${(item.value / 7) * 100}%` as DimensionValue,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[s.usrCount, { color: dt.textSecondary }]}>
                      {item.value} {item.value === 1 ? "day" : "days"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Historical Performance ─── */}
        {totalArchives > 0 && (
          <View
            style={[
              s.card,
              { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
            ]}
          >
            <Text style={[s.sectionTitle, { color: dt.text }]}>
              Historical Performance
            </Text>
            <View style={s.archiveStatsRow}>
              <View style={s.archiveStatItem}>
                <Text style={[s.archiveStatValue, { color: dt.text }]}>
                  {totalArchives}
                </Text>
                <Text style={[s.archiveStatLabel, { color: dt.textSecondary }]}>
                  Weeks Archived
                </Text>
              </View>
              <View style={s.archiveStatItem}>
                <Text style={[s.archiveStatValue, { color: dt.text }]}>
                  {minutesToHrs(avgArchiveMinutes)}
                </Text>
                <Text style={[s.archiveStatLabel, { color: dt.textSecondary }]}>
                  Avg per Week
                </Text>
              </View>
              <View style={s.archiveStatItem}>
                <Text style={[s.archiveStatValue, { color: dt.text }]}>
                  {minutesToHrs(totalLifetimeMinutes)}
                </Text>
                <Text style={[s.archiveStatLabel, { color: dt.textSecondary }]}>
                  All-Time
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Your Records ─── */}
        <View
          style={[
            s.card,
            { backgroundColor: dt.surfaceCard, shadowColor: dt.shadow },
          ]}
        >
          <Text style={[s.sectionTitle, { color: dt.text }]}>Your Records</Text>
          <View style={s.recordsList}>
            <View style={s.recordRow}>
              <MaterialCommunityIcons
                name="diamond-stone"
                size={30}
                color={dt.primary}
              />
              <View style={s.recordInfo}>
                <Text style={[s.recordLabel, { color: dt.text }]}>
                  Longest Streak
                </Text>
                <Text style={[s.recordValue, { color: dt.textSecondary }]}>
                  {currentStreak} days
                </Text>
              </View>
            </View>
            <View style={s.recordRow}>
              <MaterialCommunityIcons
                name="school"
                size={30}
                color={dt.secondary}
              />
              <View style={s.recordInfo}>
                <Text style={[s.recordLabel, { color: dt.text }]}>
                  Total Study Time
                </Text>
                <Text style={[s.recordValue, { color: dt.textSecondary }]}>
                  {minutesToHrs(totalLifetimeMinutes)}
                </Text>
              </View>
            </View>
            <View style={s.recordRow}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={30}
                color={dt.tertiary}
              />
              <View style={s.recordInfo}>
                <Text style={[s.recordLabel, { color: dt.text }]}>
                  Best Single Day
                </Text>
                <Text style={[s.recordValue, { color: dt.textSecondary }]}>
                  {bestDay.name} — {minutesToHrs(bestDay.minutes)}
                </Text>
              </View>
            </View>
            {mostStudiedTopic ? (
              <View style={s.recordRow}>
                <MaterialCommunityIcons
                  name="target"
                  size={30}
                  color={dt.primary}
                />
                <View style={s.recordInfo}>
                  <Text style={[s.recordLabel, { color: dt.text }]}>
                    Most Studied Topic
                  </Text>
                  <Text style={[s.recordValue, { color: dt.textSecondary }]}>
                    {mostStudiedTopic}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* ─── Deep Insight Banner ─── */}
        <View style={[s.insightCard, { backgroundColor: dt.surfaceLow }]}>
          <View
            style={[s.insightBadge, { backgroundColor: dt.secondaryContainer }]}
          >
            <Text style={[s.insightBadgeText, { color: dt.secondary }]}>
              DEEP INSIGHT
            </Text>
          </View>
          <Text style={[s.insightTitle, { color: dt.text }]}>
            {peakPeriod && peakPeriod.count > 0
              ? `Your peak focus hours are during the ${peakPeriod.period.toLowerCase()}.`
              : `Start logging sessions to discover your peak focus hours.`}
          </Text>
          <Text style={[s.insightBody, { color: dt.textSecondary }]}>
            {peakPeriod && peakPeriod.count > 0
              ? `Schedule your most challenging subjects during ${peakPeriod.period.toLowerCase()} hours to maximize information retention and cognitive performance.`
              : `The more study sessions you track, the more personalized insights you'll receive about your optimal study patterns.`}
          </Text>
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

/* ─── Styles (split for TS inference limit) ─── */

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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  // Hero
  heroSection: {
    marginBottom: 24,
  },
  heroTextCol: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  heroScoreCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 22,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
  },
  heroScoreLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroScoreValue: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  heroScoreIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  // Section title (reusable)
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 18,
  },

  // Generic card
  card: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
  },
});

const chartStyles = StyleSheet.create({
  // Main chart card
  chartCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  chartCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  chartPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chartPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
    gap: 6,
  },
  chartBarCol: {
    flex: 1,
    alignItems: "center",
  },
  chartBarBg: {
    width: "100%",
    height: 160,
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 999,
  },
  chartDayLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 10,
  },

  // Subject mix
  subjectCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  subjectList: {
    gap: 16,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  subjectHours: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 12,
  },
});

const statStyles = StyleSheet.create({
  // Stats grid
  statsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 18,
    padding: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  statCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  statCardValue: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statCardHint: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Distribution
  distList: {
    gap: 18,
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  distEmoji: {
    fontSize: 20,
  },
  distLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  distRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginLeft: 20,
  },
  distBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  distBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  distCount: {
    fontSize: 14,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
  },
});

const detailStyles = StyleSheet.create({
  // USR
  usrList: {
    gap: 16,
  },
  usrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  usrEmoji: {
    fontSize: 24,
  },
  usrBarWrap: {
    flex: 1,
    gap: 6,
  },
  usrBarBg: {
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

  // Archive stats
  archiveStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  archiveStatItem: {
    alignItems: "center",
  },
  archiveStatValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  archiveStatLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Records
  recordsList: {
    gap: 18,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  recordInfo: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Insight banner
  insightCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 8,
    overflow: "hidden",
  },
  insightBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  insightBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  insightTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 10,
    lineHeight: 30,
  },
  insightBody: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 22,
  },
});

const s = {
  ...baseStyles,
  ...chartStyles,
  ...statStyles,
  ...detailStyles,
};
