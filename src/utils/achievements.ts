export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'study' | 'streak' | 'social' | 'master' | 'special';
  requirement: number;
  points: number;
  unlocked: boolean;
  progress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  { id: 'study', name: 'Study Time', icon: '📚', color: '#3b82f6' },
  { id: 'streak', name: 'Consistency', icon: '🔥', color: '#f59e0b' },
  { id: 'social', name: 'Community', icon: '👥', color: '#8b5cf6' },
  { id: 'master', name: 'Mastery', icon: '🎓', color: '#10b981' },
  { id: 'special', name: 'Special', icon: '⭐', color: '#ef4444' },
];

export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'progress'>[] = [
  // Study Time Achievements
  {
    id: 'first_hour',
    title: 'First Steps',
    description: 'Complete your first hour of study',
    icon: '🎯',
    category: 'study',
    requirement: 60,
    points: 10,
    rarity: 'common',
  },
  {
    id: 'ten_hours',
    title: 'Getting Serious',
    description: 'Study for 10 hours total',
    icon: '💪',
    category: 'study',
    requirement: 600,
    points: 25,
    rarity: 'common',
  },
  {
    id: 'fifty_hours',
    title: 'Dedicated Scholar',
    description: 'Accumulate 50 hours of study time',
    icon: '📖',
    category: 'study',
    requirement: 3000,
    points: 50,
    rarity: 'rare',
  },
  {
    id: 'hundred_hours',
    title: 'Study Master',
    description: 'Reach 100 hours of total study time',
    icon: '🏆',
    category: 'study',
    requirement: 6000,
    points: 100,
    rarity: 'epic',
  },
  {
    id: 'five_hundred_hours',
    title: 'Academic Legend',
    description: 'Achieve 500 hours of study',
    icon: '👑',
    category: 'study',
    requirement: 30000,
    points: 500,
    rarity: 'legendary',
  },

  // Streak Achievements
  {
    id: 'three_day_streak',
    title: 'Consistency Builder',
    description: 'Study for 3 days in a row',
    icon: '🔥',
    category: 'streak',
    requirement: 3,
    points: 15,
    rarity: 'common',
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: '⚡',
    category: 'streak',
    requirement: 7,
    points: 30,
    rarity: 'rare',
  },
  {
    id: 'two_week_streak',
    title: 'Unstoppable Force',
    description: 'Study for 14 consecutive days',
    icon: '💥',
    category: 'streak',
    requirement: 14,
    points: 60,
    rarity: 'epic',
  },
  {
    id: 'month_streak',
    title: 'Iron Will',
    description: 'Achieve a 30-day study streak',
    icon: '🛡️',
    category: 'streak',
    requirement: 30,
    points: 150,
    rarity: 'legendary',
  },

  // Social Achievements
  {
    id: 'first_pin',
    title: 'Joined the Board',
    description: 'Pin your progress to the leaderboard',
    icon: '📌',
    category: 'social',
    requirement: 1,
    points: 10,
    rarity: 'common',
  },
  {
    id: 'top_ten',
    title: 'Rising Star',
    description: 'Reach top 10 on the leaderboard',
    icon: '🌟',
    category: 'social',
    requirement: 10,
    points: 40,
    rarity: 'rare',
  },
  {
    id: 'top_three',
    title: 'Elite Performer',
    description: 'Claim a spot in the top 3',
    icon: '🥉',
    category: 'social',
    requirement: 3,
    points: 75,
    rarity: 'epic',
  },
  {
    id: 'number_one',
    title: 'Champion',
    description: 'Reach #1 on the leaderboard',
    icon: '🥇',
    category: 'social',
    requirement: 1,
    points: 200,
    rarity: 'legendary',
  },
  {
    id: 'ten_reactions',
    title: 'Community Favorite',
    description: 'Receive 10 reactions on the board',
    icon: '❤️',
    category: 'social',
    requirement: 10,
    points: 20,
    rarity: 'common',
  },

  // Mastery Achievements
  {
    id: 'four_hour_day',
    title: 'Power Session',
    description: 'Study for 4 hours in a single day',
    icon: '💎',
    category: 'master',
    requirement: 240,
    points: 35,
    rarity: 'rare',
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Study every day for a full week',
    icon: '✨',
    category: 'master',
    requirement: 7,
    points: 50,
    rarity: 'epic',
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete 10 morning study sessions (before 9 AM)',
    icon: '🌅',
    category: 'master',
    requirement: 10,
    points: 25,
    rarity: 'rare',
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete 10 evening sessions (after 8 PM)',
    icon: '🦉',
    category: 'master',
    requirement: 10,
    points: 25,
    rarity: 'rare',
  },
  {
    id: 'focus_master',
    title: 'Focus Master',
    description: 'Achieve 5/5 self-rating 10 times',
    icon: '🧘',
    category: 'master',
    requirement: 10,
    points: 40,
    rarity: 'epic',
  },

  // Special Achievements
  {
    id: 'first_archive',
    title: 'Archive Keeper',
    description: 'Archive your first week',
    icon: '🗄️',
    category: 'special',
    requirement: 1,
    points: 15,
    rarity: 'common',
  },
  {
    id: 'fact_collector',
    title: 'Fact Collector',
    description: 'Save 25 facts to your vault',
    icon: '🧠',
    category: 'special',
    requirement: 25,
    points: 30,
    rarity: 'rare',
  },
  {
    id: 'badge_master',
    title: 'Badge Master',
    description: 'Unlock 10 different badges',
    icon: '🎖️',
    category: 'special',
    requirement: 10,
    points: 75,
    rarity: 'epic',
  },
  {
    id: 'profile_complete',
    title: 'Profile Perfect',
    description: 'Complete all profile information',
    icon: '✅',
    category: 'special',
    requirement: 1,
    points: 10,
    rarity: 'common',
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Study on 10 different weekends',
    icon: '🏖️',
    category: 'special',
    requirement: 10,
    points: 35,
    rarity: 'rare',
  },
];

export interface AchievementProgress {
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  leaderboardRank: number;
  totalReactions: number;
  bestDayMinutes: number;
  perfectWeeks: number;
  morningSessionsCount: number;
  eveningSessionsCount: number;
  topRatingsCount: number;
  archivedWeeks: number;
  factsCount: number;
  badgesCount: number;
  profileComplete: boolean;
  weekendStudyCount: number;
}

export function calculateAchievements(
  progress: AchievementProgress
): Achievement[] {
  return ALL_ACHIEVEMENTS.map((achievement) => {
    let currentProgress = 0;
    let unlocked = false;

    switch (achievement.id) {
      // Study time achievements
      case 'first_hour':
      case 'ten_hours':
      case 'fifty_hours':
      case 'hundred_hours':
      case 'five_hundred_hours':
        currentProgress = progress.totalHours * 60;
        unlocked = currentProgress >= achievement.requirement;
        break;

      // Streak achievements
      case 'three_day_streak':
      case 'week_streak':
      case 'two_week_streak':
      case 'month_streak':
        currentProgress = Math.max(
          progress.currentStreak,
          progress.longestStreak
        );
        unlocked = currentProgress >= achievement.requirement;
        break;

      // Social achievements
      case 'first_pin':
        currentProgress = progress.leaderboardRank > 0 ? 1 : 0;
        unlocked = currentProgress >= achievement.requirement;
        break;

      case 'top_ten':
        currentProgress = progress.leaderboardRank > 0 ? 11 - progress.leaderboardRank : 0;
        unlocked = progress.leaderboardRank > 0 && progress.leaderboardRank <= 10;
        break;

      case 'top_three':
        currentProgress = progress.leaderboardRank > 0 ? 4 - progress.leaderboardRank : 0;
        unlocked = progress.leaderboardRank > 0 && progress.leaderboardRank <= 3;
        break;

      case 'number_one':
        currentProgress = progress.leaderboardRank === 1 ? 1 : 0;
        unlocked = progress.leaderboardRank === 1;
        break;

      case 'ten_reactions':
        currentProgress = progress.totalReactions;
        unlocked = currentProgress >= achievement.requirement;
        break;

      // Mastery achievements
      case 'four_hour_day':
        currentProgress = progress.bestDayMinutes;
        unlocked = currentProgress >= achievement.requirement;
        break;

      case 'perfect_week':
        currentProgress = progress.perfectWeeks;
        unlocked = currentProgress >= achievement.requirement;
        break;

      case 'early_bird':
        currentProgress = progress.morningSessionsCount;
        unlocked = currentProgress >= achievement.requirement;
        break;

      case 'night_owl':
        currentProgress = progress.eveningSessionsCount;
        unlocked = currentProgress >= achievement.requirement;
        break;

      case 'focus_master':
        currentProgress = progress.topRatingsCount;
        unlocked = currentProgress >= achievement.requirement;
        break;

      // Special achievements
      case 'first_archive':
        currentProgress = progress.archivedWeeks;
        unlocked = currentProgress >= achievement.requirement;
        break;

      case 'fact_collector':
        currentProgress = progress.factsCount;
        unlocked = currentProgress >= achievement.requirement;
        break;

      case 'badge_master':
        currentProgress = progress.badgesCount;
        unlocked = currentProgress >= achievement.requirement;
        break;

      case 'profile_complete':
        currentProgress = progress.profileComplete ? 1 : 0;
        unlocked = progress.profileComplete;
        break;

      case 'weekend_warrior':
        currentProgress = progress.weekendStudyCount;
        unlocked = currentProgress >= achievement.requirement;
        break;

      default:
        break;
    }

    return {
      ...achievement,
      unlocked,
      progress: Math.min(currentProgress, achievement.requirement),
    };
  });
}

export function getProgressPercentage(achievement: Achievement): number {
  if (achievement.unlocked) return 100;
  return Math.min((achievement.progress / achievement.requirement) * 100, 100);
}

export function getTotalPoints(achievements: Achievement[]): number {
  return achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);
}

export function getUnlockedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).length;
}

export function getNextAchievement(achievements: Achievement[]): Achievement | null {
  const locked = achievements
    .filter((a) => !a.unlocked)
    .sort((a, b) => {
      const aProgress = (a.progress / a.requirement) * 100;
      const bProgress = (b.progress / b.requirement) * 100;
      return bProgress - aProgress;
    });

  return locked[0] || null;
}

export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return '#6b7280';
    case 'rare':
      return '#3b82f6';
    case 'epic':
      return '#8b5cf6';
    case 'legendary':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
}

export function getRarityLabel(rarity: Achievement['rarity']): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
