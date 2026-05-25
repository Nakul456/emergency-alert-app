import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useAccidentDetection } from "../components/AccidentDetectionContext";
import { useTheme } from "../components/ThemeContext";

export default function AccidentDetectionScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();

  const {
    isDetectionEnabled,
    sensitivity,
    activityMode,
    liveGForce,
    liveAxes,
    setDetectionEnabled,
    setSensitivity,
    setActivityMode,
    triggerSimulatedImpact,
  } = useAccidentDetection();

  // Animation values for radar pulses
  const radarScale = useSharedValue(1);
  const radarOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (isDetectionEnabled) {
      radarScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1500 }),
          withTiming(1.0, { duration: 1500 })
        ),
        -1,
        true
      );
      radarOpacity.value = withRepeat(
        withSequence(
          withTiming(0.1, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      radarScale.value = 1;
      radarOpacity.value = 0.2;
    }
  }, [isDetectionEnabled]);

  const animatedRadarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: radarScale.value }],
    opacity: radarOpacity.value,
  }));

  // G-Force gauge animation
  const maxGForceValue = 8.0; // max gauge scale
  const gaugePercent = Math.min((liveGForce / maxGForceValue) * 100, 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: "rgba(255, 255, 255, 0.2)" }]}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Crash Guard</Text>
        <Text style={styles.sub}>Edge AI Telemetry & Impact Controls</Text>
      </View>

      <View style={styles.content}>
        {/* ACTIVE STATUS & RADAR */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={[styles.radarCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Edge Monitoring</Text>
              <Text style={[styles.cardSub, { color: colors.subText }]}>
                {isDetectionEnabled ? "Continuously analyzing device inertia" : "Crash guard is paused"}
              </Text>
            </View>
            <Switch
              value={isDetectionEnabled}
              onValueChange={setDetectionEnabled}
              trackColor={{ false: "#D5D8DC", true: "#FFD0D0" }}
              thumbColor={isDetectionEnabled ? "#EF4444" : "#F4F6F8"}
            />
          </View>

          {/* Glowing Concentric Radar Waves */}
          <View style={styles.radarVisualizer}>
            <Animated.View
              style={[
                styles.radarCircleOutline,
                animatedRadarStyle,
                { borderColor: isDetectionEnabled ? "#EF4444" : colors.border },
              ]}
            />
            <View
              style={[
                styles.radarCenterNode,
                { backgroundColor: isDetectionEnabled ? "rgba(239, 68, 68, 0.1)" : colors.accent, borderColor: isDetectionEnabled ? "#EF4444" : colors.border },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={40}
                color={isDetectionEnabled ? "#EF4444" : colors.subText}
              />
            </View>
          </View>

          <View style={styles.sensorStateRow}>
            <View style={styles.sensorIndicator}>
              <View style={[styles.bullet, { backgroundColor: isDetectionEnabled ? "#34C759" : "#8E8E93" }]} />
              <Text style={[styles.bulletText, { color: colors.text }]}>
                {isDetectionEnabled ? "HEURISTIC ACCELEROMETER ONLINE" : "ENGINE SHUTDOWN"}
              </Text>
            </View>
            <Text style={[styles.hertzLabel, { color: colors.subText }]}>50Hz POLLING</Text>
          </View>
        </Animated.View>

        {/* TELEMETRY READOUTS */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Live G-Force Telemetry</Text>

          <View style={styles.telemetryContainer}>
            {/* Circular Gauge */}
            <View style={[styles.gaugeContainer, { borderColor: colors.border }]}>
              <Text style={[styles.gaugeVal, { color: colors.text }]}>{liveGForce.toFixed(2)}</Text>
              <Text style={[styles.gaugeUnit, { color: colors.subText }]}>G-FORCE</Text>
              <View style={[styles.gaugeProgress, { width: `${gaugePercent}%`, backgroundColor: liveGForce > 2.0 ? "#EF4444" : colors.primary }]} />
            </View>

            {/* XYZ Axes Readouts */}
            <View style={styles.axesContainer}>
              <Text style={[styles.axesTitle, { color: colors.text }]}>3-Axis Acceleration</Text>

              {/* X Axis */}
              <View style={styles.axisRow}>
                <View style={styles.axisMeta}>
                  <Text style={styles.axisLetterX}>X</Text>
                  <Text style={[styles.axisVal, { color: colors.text }]}>{liveAxes.x.toFixed(3)}G</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(Math.abs(liveAxes.x) * 100, 100)}%`,
                        backgroundColor: "#FF3B30",
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Y Axis */}
              <View style={styles.axisRow}>
                <View style={styles.axisMeta}>
                  <Text style={styles.axisLetterY}>Y</Text>
                  <Text style={[styles.axisVal, { color: colors.text }]}>{liveAxes.y.toFixed(3)}G</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(Math.abs(liveAxes.y) * 100, 100)}%`,
                        backgroundColor: "#34C759",
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Z Axis */}
              <View style={styles.axisRow}>
                <View style={styles.axisMeta}>
                  <Text style={styles.axisLetterZ}>Z</Text>
                  <Text style={[styles.axisVal, { color: colors.text }]}>{liveAxes.z.toFixed(3)}G</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(Math.abs(liveAxes.z) * 100, 100)}%`,
                        backgroundColor: "#007AFF",
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* CALIBRATION SETTINGS */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Activity Calibration Mode</Text>

          {/* Mode Selector Cards */}
          <View style={styles.modesGrid}>
            <TouchableOpacity
              style={[
                styles.modeBox,
                activityMode === "Vehicle"
                  ? { backgroundColor: colors.accent, borderColor: "#EF4444" }
                  : { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => setActivityMode("Vehicle")}
            >
              <Ionicons
                name="car-sport"
                size={30}
                color={activityMode === "Vehicle" ? "#EF4444" : colors.subText}
              />
              <Text style={[styles.modeLabel, { color: colors.text }]}>Vehicle Driving</Text>
              <Text style={styles.modeDesc}>High-speed crash profiling. Filters normal road bumps. (4.5G threshold)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBox,
                activityMode === "Walking"
                  ? { backgroundColor: colors.accent, borderColor: "#EF4444" }
                  : { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => setActivityMode("Walking")}
            >
              <Ionicons
                name="walk"
                size={30}
                color={activityMode === "Walking" ? "#EF4444" : colors.subText}
              />
              <Text style={[styles.modeLabel, { color: colors.text }]}>Walking Fall Guard</Text>
              <Text style={styles.modeDesc}>Elderly safety & walking mode. High-accuracy fall profiles. (2.5G threshold)</Text>
            </TouchableOpacity>
          </View>

          {/* Sensitivity Segmented Selector */}
          <Text style={[styles.settingLabel, { color: colors.text, marginTop: 20 }]}>AI Detection Sensitivity</Text>
          <View style={[styles.segmentedControl, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {(["Low", "Standard", "High"] as const).map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.segmentItem,
                  sensitivity === lvl
                    ? { backgroundColor: "#EF4444" }
                    : null,
                ]}
                onPress={() => setSensitivity(lvl)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    sensitivity === lvl
                      ? { color: "#fff", fontWeight: "900" }
                      : { color: colors.subText },
                  ]}
                >
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* INTERACTIVE COLLISION SIMULATOR */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>Interactive Test Simulator</Text>
          <Text style={[styles.simText, { color: colors.subText }]}>
            Safely verify your full emergency broadcast pipeline (including Siren alarm, vibration warnings, and SOS broadcasts) without dropping your device or simulating real collisions.
          </Text>

          <TouchableOpacity style={styles.simBtn} activeOpacity={0.8} onPress={triggerSimulatedImpact}>
            <Ionicons name="flash" size={24} color="#fff" />
            <Text style={styles.simBtnText}>SIMULATE COLLISION IMPACT</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 120 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#E11D48",
    paddingTop: 80,
    paddingBottom: 45,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  sub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -30,
  },
  card: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  radarCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
  radarVisualizer: {
    height: 180,
    width: 180,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 25,
  },
  radarCircleOutline: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
  },
  radarCenterNode: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sensorStateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    paddingTop: 15,
  },
  sensorIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bulletText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  hertzLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 20,
    opacity: 0.6,
  },
  telemetryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  gaugeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  gaugeVal: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  gaugeUnit: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  gaugeProgress: {
    position: "absolute",
    bottom: 0,
    height: 6,
  },
  axesContainer: {
    flex: 1,
    gap: 12,
  },
  axesTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  axisRow: {
    width: "100%",
    gap: 6,
  },
  axisMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  axisLetterX: {
    color: "#FF3B30",
    fontWeight: "900",
    fontSize: 13,
  },
  axisLetterY: {
    color: "#34C759",
    fontWeight: "900",
    fontSize: 13,
  },
  axisLetterZ: {
    color: "#007AFF",
    fontWeight: "900",
    fontSize: 13,
  },
  axisVal: {
    fontWeight: "800",
    fontSize: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  modesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 15,
  },
  modeBox: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
    gap: 8,
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  modeDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: "#7E7E7E",
    fontWeight: "500",
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    padding: 4,
    justifyContent: "space-between",
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
  },
  simText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 20,
  },
  simBtn: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 24,
    gap: 10,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  simBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
