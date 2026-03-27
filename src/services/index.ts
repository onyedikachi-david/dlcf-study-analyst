import { ProfileSyncService } from "./profileSync";
import { LeaderboardSyncService } from "./leaderboardSync";
import { StudySessionsSyncService } from "./studySessionsSync";

export { ProfileSyncService } from "./profileSync";
export { LeaderboardSyncService } from "./leaderboardSync";
export { StudySessionsSyncService } from "./studySessionsSync";

/**
 * Initialize all sync services for the authenticated user
 */
export async function initializeAllSyncServices(userId: string): Promise<void> {
  try {
    console.log("Initializing sync services for user:", userId);

    // Initialize profile sync
    await ProfileSyncService.initialize(userId);
    console.log("Profile sync initialized");

    // Initialize leaderboard sync (with realtime)
    await LeaderboardSyncService.initialize();
    console.log("Leaderboard sync initialized");

    // Initialize study sessions sync
    await StudySessionsSyncService.initialize(userId);
    console.log("Study sessions sync initialized");

    console.log("All sync services initialized successfully");
  } catch (error) {
    console.error("Error initializing sync services:", error);
    throw error;
  }
}

/**
 * Cleanup all sync services on logout
 */
export async function cleanupAllSyncServices(): Promise<void> {
  try {
    console.log("Cleaning up sync services");

    // Cleanup leaderboard subscription
    await LeaderboardSyncService.cleanup();

    console.log("All sync services cleaned up");
  } catch (error) {
    console.error("Error cleaning up sync services:", error);
  }
}
