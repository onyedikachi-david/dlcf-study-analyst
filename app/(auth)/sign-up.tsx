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

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signUp } = useAuth();
  const toast = useToast();

  const handleSignUp = async () => {
    setError("");

    if (!name || !email || !password || !faculty || !department || !level) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Basic email validation
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password, {
        name,
        faculty,
        department,
        level,
      });

      if (signUpError) {
        // Map common error messages to user-friendly ones
        let errorMessage =
          signUpError.message || "Sign up failed. Please try again.";

        if (errorMessage.includes("already registered")) {
          errorMessage = "This email is already registered. Please sign in.";
        } else if (errorMessage.includes("invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (
          errorMessage.includes("network") ||
          errorMessage.includes("Network")
        ) {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else if (errorMessage.includes("Password should be")) {
          errorMessage = "Password must be at least 6 characters.";
        }

        setError(errorMessage);
        toast.error("Sign Up Failed", errorMessage);
      } else {
        // Sign-up successful - error is null
        console.log("Sign-up successful! Account created.");
        setError("");
        toast.success(
          "Success!",
          "Account created successfully! You can now sign in.",
        );
        setTimeout(() => {
          router.replace("./sign-in");
        }, 1500);
      }
    } catch (err) {
      console.error("Unexpected error during sign-up:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push("./sign-in");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the study community</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError("");
              }}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
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
            <Text style={styles.label}>Faculty *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Engineering, Science"
              placeholderTextColor="#999"
              value={faculty}
              onChangeText={(text) => {
                setFaculty(text);
                if (error) setError("");
              }}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Department *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Computer Science"
              placeholderTextColor="#999"
              value={department}
              onChangeText={(text) => {
                setDepartment(text);
                if (error) setError("");
              }}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Level *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 100, 200, 300"
              placeholderTextColor="#999"
              value={level}
              onChangeText={(text) => {
                setLevel(text);
                if (error) setError("");
              }}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="At least 6 characters"
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Re-enter your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError("");
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={handleSignIn} disabled={loading}>
              <Text style={styles.footerLink}>Sign In</Text>
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
    padding: 24,
    paddingTop: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
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
    marginBottom: 16,
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
  button: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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
    marginBottom: 24,
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
