import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Animated } from "react-native";
import { useEffect, useState, useRef } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { ToastProvider } from "@/components/Toast";

const MINIMUM_SPLASH_DURATION = 5500; // Show splash for at least 5.5 seconds

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();

  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const splashStartTime = useRef(Date.now());
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Track when auth loading completes
  useEffect(() => {
    if (!loading) {
      setAuthReady(true);
    }
  }, [loading]);

  // Handle splash screen dismissal with minimum duration
  useEffect(() => {
    if (authReady) {
      const elapsed = Date.now() - splashStartTime.current;
      const remainingTime = Math.max(0, MINIMUM_SPLASH_DURATION - elapsed);

      const timeout = setTimeout(() => {
        // Fade out splash screen
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
      }, remainingTime);

      return () => clearTimeout(timeout);
    }
  }, [authReady, fadeAnim]);

  // Handle navigation when auth state changes
  useEffect(() => {
    if (loading || showSplash) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (session && inAuthGroup) {
      // User is signed in but on auth screen, redirect to tabs
      console.log("Layout: Redirecting authenticated user to dashboard");
      router.replace("/");
    } else if (!session && !inAuthGroup) {
      // User is signed out but not on auth screen, redirect to auth
      console.log("Layout: Redirecting unauthenticated user to auth");
      router.replace("/(auth)/sign-in");
    }
  }, [session, segments, loading, router, showSplash]);

  // Show splash screen during initialization
  if (showSplash) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SplashScreen />
        <StatusBar style="auto" />
      </Animated.View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Modal",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RootLayoutNav />
      </ToastProvider>
    </AuthProvider>
  );
}
