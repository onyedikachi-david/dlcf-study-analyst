import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { initializeAllSyncServices, cleanupAllSyncServices } from "../services";
import { useProfileStore } from "../stores/useProfileStore";
import { ProfileSyncService } from "../services/profileSync";

interface SignUpMetadata {
  name: string;
  faculty: string;
  department: string;
  level: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: SignUpMetadata,
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    console.log("AuthContext: Getting initial session...");
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log("AuthContext: Initial session:", s ? "Found" : "None");
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);

      if (s?.user) {
        console.log(
          "AuthContext: Initializing sync services for user:",
          s.user.id,
        );
        initializeAllSyncServices(s.user.id).catch(console.error);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(
        "AuthContext: Auth state changed - Event:",
        event,
        "Session:",
        !!currentSession,
      );
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN" && currentSession?.user) {
        console.log("AuthContext: SIGNED_IN event - Initializing services");
        await initializeAllSyncServices(currentSession.user.id).catch(
          console.error,
        );
      }

      if (event === "SIGNED_OUT") {
        console.log("AuthContext: SIGNED_OUT event - Cleaning up services");
        await cleanupAllSyncServices().catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata?: SignUpMetadata,
  ): Promise<{ error: AuthError | null }> => {
    console.log("AuthContext: signUp called for email:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (error) {
      console.log("AuthContext: signUp error:", error.message);
      return { error };
    }

    if (!data.user) {
      console.log("AuthContext: signUp failed - No user returned");
      return {
        error: {
          message: "Sign up failed. User was not created.",
          name: "NoUserError",
          status: 500,
        } as AuthError,
      };
    }

    console.log("AuthContext: signUp success, user ID:", data.user.id);

    // Create profile in database after successful signup
    if (metadata) {
      console.log("AuthContext: Creating profile for new user");
      const { setProfile } = useProfileStore.getState();

      // Update local store immediately
      setProfile({
        name: metadata.name,
        faculty: metadata.faculty,
        department: metadata.department,
        level: metadata.level,
      });

      // Sync to database
      try {
        await ProfileSyncService.syncProfile(data.user.id);
        console.log("AuthContext: Profile synced to database");
      } catch (syncError) {
        console.error("AuthContext: Profile sync failed:", syncError);
        // Don't fail the signup if profile sync fails
      }
    }

    return { error: null };
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: AuthError | null }> => {
    console.log("AuthContext: signIn called for email:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("AuthContext: signIn error:", error.message);
      return { error };
    }

    if (!data.session) {
      console.log("AuthContext: signIn failed - No session returned");
      return {
        error: {
          message: "Sign in failed. No session was created.",
          name: "NoSessionError",
          status: 500,
        } as AuthError,
      };
    }

    if (!data.user) {
      console.log("AuthContext: signIn failed - No user returned");
      return {
        error: {
          message: "Sign in failed. User data not found.",
          name: "NoUserError",
          status: 500,
        } as AuthError,
      };
    }

    console.log(
      "AuthContext: signIn success - User:",
      data.user.id,
      "Session:",
      !!data.session,
    );
    return { error: null };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    console.log("AuthContext: signOut called");
    await cleanupAllSyncServices();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("AuthContext: signOut error:", error.message);
    } else {
      console.log("AuthContext: signOut success");
    }

    return { error };
  };

  const resetPassword = async (
    email: string,
  ): Promise<{ error: AuthError | null }> => {
    console.log("AuthContext: resetPassword called for email:", email);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.log("AuthContext: resetPassword error:", error.message);
      return { error };
    }

    console.log("AuthContext: resetPassword success");
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
