import { useAppStore } from "@/src/stores";
import { Colors } from "@/src/theme/colors";
import React, { memo, useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FactItemProps {
  fact: string;
  index: number;
  totalCount: number;
  onDelete: (index: number) => void;
}

const FactItem = memo(function FactItem({
  fact,
  index,
  totalCount,
  onDelete,
}: FactItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const translateX = useSharedValue(0);
  const factNumber = totalCount - index;

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Fact", "Are you sure you want to delete this fact?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(index) },
    ]);
  }, [index, onDelete]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(-10)
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.set(Math.max(e.translationX, -100));
      }
    })
    .onEnd((e) => {
      if (e.translationX < -60) {
        runOnJS(handleDelete)();
      }
      translateX.set(withTiming(0));
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  return (
    <View style={styles.factItemContainer}>
      <View
        style={[styles.deleteBackground, { backgroundColor: colors.error }]}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.factItem,
            { backgroundColor: colors.surface },
            animatedStyle,
          ]}
        >
          <View
            style={[styles.factNumber, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.factNumberText}>{factNumber}</Text>
          </View>
          <Text
            style={[styles.factText, { color: colors.text }]}
            numberOfLines={3}
          >
            {fact}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { facts, addFact, removeFact } = useAppStore();
  const [newFact, setNewFact] = useState("");

  const handleAddFact = useCallback(() => {
    const trimmed = newFact.trim();
    if (!trimmed) return;

    const success = addFact(trimmed);
    if (success) {
      setNewFact("");
    } else {
      Alert.alert("Vault Full", "You can only save up to 50 facts.");
    }
  }, [newFact, addFact]);

  const handleDelete = useCallback(
    (index: number) => {
      removeFact(index);
    },
    [removeFact],
  );

  const isFactMaster = facts.length >= 10;

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <FactItem
        fact={item}
        index={index}
        totalCount={facts.length}
        onDelete={handleDelete}
      />
    ),
    [facts.length, handleDelete],
  );

  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>
              🧠 Fact Vault
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Your high-yield knowledge bank
            </Text>
          </View>
          <View style={styles.vaultStats}>
            <Text style={[styles.vaultStatValue, { color: colors.text }]}>
              {facts.length}
            </Text>
            <Text
              style={[styles.vaultStatLabel, { color: colors.textSecondary }]}
            >
              /50 facts
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { backgroundColor: colors.background }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: isFactMaster
                    ? colors.success
                    : colors.primary,
                  width: `${(facts.length / 50) * 100}%`,
                },
              ]}
            />
          </View>
          {isFactMaster && (
            <View
              style={[
                styles.masterBadge,
                { backgroundColor: colors.success + "20" },
              ]}
            >
              <Text style={[styles.masterBadgeText, { color: colors.success }]}>
                🏆 Fact Master!
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Input Card */}
      <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          ✨ Add New Fact
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text },
            ]}
            value={newFact}
            onChangeText={setNewFact}
            placeholder="Type a key fact to remember..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={handleAddFact}
            returnKeyType="done"
            multiline
            maxLength={200}
          />
          <Pressable
            onPress={handleAddFact}
            disabled={!newFact.trim()}
            style={[
              styles.addBtn,
              { backgroundColor: colors.primary },
              !newFact.trim() && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
        <Text style={[styles.charCount, { color: colors.textSecondary }]}>
          {newFact.length}/200
        </Text>
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {facts.length > 0 ? (
          <FlatList
            data={facts}
            renderItem={renderItem}
            keyExtractor={(_: string, index: number) => index.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Text style={styles.emptyIcon}>🧠</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Your vault is empty
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Save key facts during study for quick revision later.
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        ← Swipe left to delete
      </Text>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  brand: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  vaultStats: {
    alignItems: "flex-end",
  },
  vaultStatValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  vaultStatLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  masterBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  masterBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  // Input Card
  inputCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignSelf: "flex-end",
  },
  addBtnText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  charCount: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "right",
  },

  // List
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
    gap: 10,
  },

  // Fact Item
  factItemContainer: {
    position: "relative",
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  factItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  factNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  factNumberText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  factText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 20,
  },

  hint: {
    textAlign: "center",
    fontSize: 12,
    paddingVertical: 12,
    fontWeight: "500",
  },
});
