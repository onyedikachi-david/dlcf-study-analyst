import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  show: (config: ToastConfig) => void;
  hide: () => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

interface ToastState extends ToastConfig {
  visible: boolean;
  id: number;
}

/* ═══════════════════════════════════════════════════
   CONTEXT
   ═══════════════════════════════════════════════════ */

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/* ═══════════════════════════════════════════════════
   TOAST ITEM COMPONENT
   ═══════════════════════════════════════════════════ */

interface ToastItemProps {
  toast: ToastState;
  onHide: () => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  // Design tokens
  const dt = {
    bg: isDark ? "#0f0f1a" : "#f6fafe",
    surface: isDark ? "#1e1e32" : "#ffffff",
    surfaceHigh: isDark ? "#2a2a45" : "#e1e9f0",
    primary: isDark ? "#7fb6ff" : "#0060ad",
    secondary: isDark ? "#4ecdc4" : "#146a65",
    tertiary: isDark ? "#eec540" : "#745c00",
    error: isDark ? "#f87171" : "#ac3434",
    text: isDark ? "#f1f5f9" : "#2a3439",
    textSecondary: isDark ? "#94a3b8" : "#576067",
    shadow: isDark ? "rgba(0,0,0,0.5)" : "rgba(42,52,57,0.15)",
  };

  // Get type-specific styling
  const getTypeConfig = () => {
    switch (toast.type) {
      case "success":
        return {
          icon: "check-circle" as const,
          color: dt.secondary,
          bgTint: isDark ? "rgba(78,205,196,0.15)" : "rgba(20,106,101,0.08)",
        };
      case "error":
        return {
          icon: "alert-circle" as const,
          color: dt.error,
          bgTint: isDark ? "rgba(248,113,113,0.15)" : "rgba(172,52,52,0.08)",
        };
      case "warning":
        return {
          icon: "alert" as const,
          color: dt.tertiary,
          bgTint: isDark ? "rgba(238,197,64,0.15)" : "rgba(116,92,0,0.08)",
        };
      case "info":
      default:
        return {
          icon: "information" as const,
          color: dt.primary,
          bgTint: isDark ? "rgba(127,182,255,0.15)" : "rgba(0,96,173,0.08)",
        };
    }
  };

  const typeConfig = getTypeConfig();

  useEffect(() => {
    // Enter animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide timer
    const duration = toast.duration ?? 3500;
    const timer = setTimeout(() => {
      handleHide();
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [translateY, opacity, scale, onHide]);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: insets.top + 8,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Pressable onPress={handleHide} style={{ flex: 1 }}>
        <View
          style={[
            styles.toast,
            {
              backgroundColor: dt.surface,
              shadowColor: dt.shadow,
              borderColor: typeConfig.color + "30",
            },
          ]}
        >
          {/* Colored accent bar */}
          <View
            style={[styles.accentBar, { backgroundColor: typeConfig.color }]}
          />

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: typeConfig.bgTint },
            ]}
          >
            <MaterialCommunityIcons
              name={typeConfig.icon}
              size={20}
              color={typeConfig.color}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: dt.text }]} numberOfLines={1}>
              {toast.title}
            </Text>
            {toast.message ? (
              <Text
                style={[styles.message, { color: dt.textSecondary }]}
                numberOfLines={2}
              >
                {toast.message}
              </Text>
            ) : null}
          </View>

          {/* Action button */}
          {toast.action ? (
            <Pressable
              onPress={() => {
                toast.action?.onPress();
                handleHide();
              }}
              style={[
                styles.actionButton,
                { backgroundColor: typeConfig.color + "15" },
              ]}
            >
              <Text style={[styles.actionText, { color: typeConfig.color }]}>
                {toast.action.label}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleHide} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={dt.textSecondary}
              />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════
   TOAST PROVIDER
   ═══════════════════════════════════════════════════ */

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastIdRef = useRef(0);

  const show = useCallback((config: ToastConfig) => {
    toastIdRef.current += 1;
    setToast({
      ...config,
      visible: true,
      id: toastIdRef.current,
    });
  }, []);

  const hide = useCallback(() => {
    setToast(null);
  }, []);

  const success = useCallback(
    (title: string, message?: string) => {
      show({ type: "success", title, message });
    },
    [show],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      show({ type: "error", title, message });
    },
    [show],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      show({ type: "info", title, message });
    },
    [show],
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      show({ type: "warning", title, message });
    },
    [show],
  );

  const contextValue: ToastContextType = {
    show,
    hide,
    success,
    error,
    info,
    warning,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast?.visible ? (
        <ToastItem key={toast.id} toast={toast} onHide={hide} />
      ) : null}
    </ToastContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    maxWidth: 420,
    alignSelf: "center",
    width: SCREEN_WIDTH - 32,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingLeft: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 18,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
});

export default ToastProvider;
