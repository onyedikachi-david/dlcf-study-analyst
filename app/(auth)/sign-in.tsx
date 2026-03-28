import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useToast } from "@/components/Toast";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signIn } = useAuth();
  const toast = useToast();

  const handleSignIn = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    // Basic email validation
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        // Map common error messages to user-friendly ones
        let errorMessage =
          signInError.message || "Sign in failed. Please try again.";

        if (errorMessage.includes("Invalid login credentials")) {
          errorMessage = "Incorrect email or password. Please try again.";
        } else if (errorMessage.includes("Email not confirmed")) {
          errorMessage = "Please verify your email address before signing in.";
        } else if (
          errorMessage.includes("network") ||
          errorMessage.includes("Network")
        ) {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else if (
          errorMessage.includes("No session") ||
          errorMessage.includes("No user")
        ) {
          errorMessage = "Authentication failed. Please try again.";
        }

        setError(errorMessage);
        toast.error("Sign In Failed", errorMessage);
      } else {
        // Sign-in successful - error is null
        console.log("Sign-in successful! Session created.");
        setError("");
        toast.success("Welcome back!", "Loading your dashboard...");
        // Explicitly navigate to dashboard
        router.replace("/");
      }
    } catch (err) {
      console.error("Unexpected error during sign-in:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your study journey
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError("");
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Pressable
            style={styles.forgotPassword}
            onPress={() => router.push("./reset-password")}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account? "}</Text>
            <Pressable
              onPress={() => router.push("./sign-up")}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#1a1a1a",
  },
  passwordContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#1a1a1a",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  button: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#b3d9ff",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  footerLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});
