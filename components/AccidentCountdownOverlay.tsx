import React, { useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";
import { useAccidentDetection } from "./AccidentDetectionContext";
import { useTheme } from "./ThemeContext";

export default function AccidentCountdownOverlay() {
  const {
    isAlertCountdownActive,
    alertCountdown,
    cancelAlertCountdown,
    isTriggeringSOS,
    activityMode,
  } = useAccidentDetection();

  const { colors } = useTheme();

  // Animation shared values for pulsing
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isAlertCountdownActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
      glowOpacity.value = 0.3;
    }
  }, [isAlertCountdownActive]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: glowOpacity.value,
  }));

  if (!isAlertCountdownActive) return null;

  return (
    <Modal
      transparent
      visible={isAlertCountdownActive}
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={Platform.OS === "ios" ? 80 : 100} style={styles.blurContainer} tint="dark">
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.container}>
          {/* Header Warning Label */}
          <View style={styles.header}>
            <View style={styles.dangerBadge}>
              <Ionicons name="warning" size={20} color="#FF3B30" />
              <Text style={styles.dangerBadgeText}>
                {activityMode === "Vehicle" ? "AI CRASH DETECTED" : "AI FALL DETECTED"}
              </Text>
            </View>
            <Text style={styles.alertSubtitle}>HIGH G-FORCE IMPACT EVENT REGISTERED</Text>
          </View>

          {/* Central Animated Pulse Indicator */}
          <View style={styles.centerContainer}>
            {/* Concentric Glow Rings */}
            <Animated.View style={[styles.glowRing, animatedPulseStyle]} />
            <Animated.View style={[styles.glowRing2, animatedPulseStyle]} />

            <Animated.View entering={ZoomIn.springify()} style={styles.countdownCircle}>
              {isTriggeringSOS ? (
                <View style={styles.triggeringContainer}>
                  <Ionicons name="cloud-upload" size={60} color="#fff" />
                  <Text style={styles.triggeringText}>SENDING...</Text>
                </View>
              ) : (
                <View style={styles.timerContent}>
                  <Text style={styles.secondsRemaining}>{alertCountdown}</Text>
                  <Text style={styles.secondsLabel}>SECONDS</Text>
                </View>
              )}
            </Animated.View>
          </View>

          {/* Description Action Notice */}
          <View style={styles.footer}>
            <Text style={styles.warningDescription}>
              An emergency broadcast is about to be initiated. The system will automatically:
            </Text>

            <View style={styles.actionItems}>
              <View style={styles.actionRow}>
                <Ionicons name="chatbubbles" size={22} color="#FF453A" />
                <Text style={styles.actionRowText}>Send SMS alerts with live coordinates</Text>
              </View>
              <View style={styles.actionRow}>
                <Ionicons name="cloud-upload" size={22} color="#FF453A" />
                <Text style={styles.actionRowText}>Log active incident to medical rescue cloud</Text>
              </View>
              <View style={styles.actionRow}>
                <Ionicons name="navigate" size={22} color="#FF453A" />
                <Text style={styles.actionRowText}>Activate background live tracking</Text>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={cancelAlertCountdown}
              disabled={isTriggeringSOS}
            >
              <Text style={styles.cancelButtonText}>I AM OK - CANCEL SOS</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  dangerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderColor: "rgba(255, 59, 48, 0.4)",
    borderWidth: 1.5,
    gap: 10,
  },
  dangerBadgeText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  alertSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 8,
  },
  centerContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 69, 58, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 69, 58, 0.4)",
  },
  glowRing2: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "rgba(255, 69, 58, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.2)",
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.25)",
  },
  timerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  secondsRemaining: {
    color: "#fff",
    fontSize: 84,
    fontWeight: "900",
    lineHeight: 88,
  },
  secondsLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: -5,
  },
  triggeringContainer: {
    alignItems: "center",
    gap: 8,
  },
  triggeringText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  footer: {
    alignItems: "center",
    width: "100%",
  },
  warningDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  actionItems: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 15,
    marginBottom: 35,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  actionRowText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  cancelButton: {
    width: "100%",
    backgroundColor: "#34C759",
    paddingVertical: 24,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
