import { supabase } from "../lib/supabase";
import { useProfileStore } from "../stores/useProfileStore";
import type { Database } from "../types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export class ProfileSyncService {
  /**
   * Fetch profile from Supabase and update local store
   */
  static async fetchProfile(userId: string): Promise<{ error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Handle case where profile doesn't exist yet (PGRST116)
      if (error && error.code === "PGRST116") {
        console.log("Profile not found, will be created on first update");
        return { error: null };
      }

      if (error) throw error;

      if (data) {
        const { setProfile } = useProfileStore.getState();
        setProfile({
          name: data.name,
          faculty: data.faculty,
          department: data.department,
          level: data.level,
          accountabilityPartner: data.accountability_partner,
          avatarUri: data.avatar_url || undefined,
        });
      }

      return { error: null };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return { error: error as Error };
    }
  }

  /**
   * Sync local profile to Supabase
   */
  static async syncProfile(userId: string): Promise<{ error: Error | null }> {
    try {
      const { profile } = useProfileStore.getState();

      const profileData: ProfileInsert = {
        id: userId,
        name: profile.name,
        faculty: profile.faculty,
        department: profile.department,
        level: profile.level,
        accountability_partner: profile.accountabilityPartner,
        avatar_url: profile.avatarUri || null,
      };

      const { error } = await supabase.from("profiles").upsert(profileData, {
        onConflict: "id",
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Error syncing profile:", error);
      return { error: error as Error };
    }
  }

  /**
   * Update specific profile fields
   */
  static async updateProfile(
    userId: string,
    updates: Partial<ProfileUpdate>,
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;

      // Update local store
      const { setProfile } = useProfileStore.getState();
      const localUpdates: any = {};

      if (updates.name) localUpdates.name = updates.name;
      if (updates.faculty) localUpdates.faculty = updates.faculty;
      if (updates.department) localUpdates.department = updates.department;
      if (updates.level) localUpdates.level = updates.level;
      if (updates.accountability_partner !== undefined) {
        localUpdates.accountabilityPartner = updates.accountability_partner;
      }
      if (updates.avatar_url !== undefined) {
        localUpdates.avatarUri = updates.avatar_url || undefined;
      }

      setProfile(localUpdates);

      return { error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { error: error as Error };
    }
  }

  /**
   * Upload avatar image to Supabase Storage
   */
  static async uploadAvatar(
    userId: string,
    fileUri: string,
    fileType: string = "image/jpeg",
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      // Read file as blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const fileExt = fileType.split("/")[1] || "jpg";
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          contentType: fileType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Update profile with new avatar URL
      await this.updateProfile(userId, { avatar_url: publicUrl });

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return { url: null, error: error as Error };
    }
  }

  /**
   * Delete avatar from storage
   */
  static async deleteAvatar(userId: string): Promise<{ error: Error | null }> {
    try {
      const { profile } = useProfileStore.getState();

      if (!profile.avatarUri) {
        return { error: null };
      }

      // Extract file path from URL
      const url = new URL(profile.avatarUri);
      const pathParts = url.pathname.split("/avatars/");
      const filePath = pathParts[1];

      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([filePath]);

        if (deleteError) throw deleteError;
      }

      // Update profile to remove avatar URL
      await this.updateProfile(userId, { avatar_url: null });

      return { error: null };
    } catch (error) {
      console.error("Error deleting avatar:", error);
      return { error: error as Error };
    }
  }

  /**
   * Initialize profile sync - fetch from server and setup realtime subscription
   */
  static async initialize(userId: string): Promise<{ error: Error | null }> {
    try {
      // Fetch initial profile
      await this.fetchProfile(userId);

      // Setup realtime subscription for profile changes
      const subscription = supabase
        .channel(`profile:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === "UPDATE" && payload.new) {
              const data = payload.new as ProfileRow;
              const { setProfile } = useProfileStore.getState();
              setProfile({
                name: data.name,
                faculty: data.faculty,
                department: data.department,
                level: data.level,
                accountabilityPartner: data.accountability_partner,
                avatarUri: data.avatar_url || undefined,
              });
            }
          },
        )
        .subscribe();

      return { error: null };
    } catch (error) {
      console.error("Error initializing profile sync:", error);
      return { error: error as Error };
    }
  }
}
