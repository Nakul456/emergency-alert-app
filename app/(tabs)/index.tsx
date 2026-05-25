import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Audio } from "expo-av";
import { Camera, CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import * as SMS from "expo-sms";
import * as TaskManager from "expo-task-manager";
import * as Battery from "expo-battery";
import * as Network from "expo-network";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Vibration,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Layout,
  ZoomIn,
  SlideInUp,
  SlideInDown
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useTheme } from "../../components/ThemeContext";
import { triggerEmergencySOS } from "../../utils/emergencyHelper";
import { useAccidentDetection } from "../../components/AccidentDetectionContext";

import { push, ref } from "firebase/database";
import { db } from "../../firebaseConfig";

const LOCATION_TRACKING = 'location-tracking';

TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }: any) => {
  if (error) {
    console.log("Background Task Error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      try {
        await push(ref(db, "emergencies"), {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          time: Date.now(),
          isLiveUpdate: true,
          isBackground: true,
        });
        console.log("Background location update sent ✅");
      } catch (err) {
        console.log("Firebase Background Push Error:", err);
      }
    }
  }
});

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { isDetectionEnabled, activityMode } = useAccidentDetection();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);

  // System Status States
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string>("Checking...");
  const [gpsStatus, setGpsStatus] = useState<string>("Checking...");
  const [smsServiceActive, setSmsServiceActive] = useState(true);
  const [voiceSosEnabled, setVoiceSosEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Profile Username & Greeting
  const [userName, setUserName] = useState("");

  const getGreeting = () => {
    const hour = new Date().getHours();
    let nameSuffix = userName ? `, ${userName}` : "";
    if (hour < 12) {
      return `Good Morning${nameSuffix} 👋`;
    } else if (hour < 17) {
      return `Good Afternoon${nameSuffix} 👋`;
    } else {
      return `Good Evening${nameSuffix} 👋`;
    }
  };

  // Animation values for SOS pulse
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  const updateSystemStatus = useCallback(async () => {
    // Battery
    if (Platform.OS !== "web") {
      try {
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(level * 100));
      } catch (e) {
        setBatteryLevel(85);
      }
    } else {
      setBatteryLevel(85); // Simulated battery level for web demo
    }

    // Network
    try {
      const network = await Network.getNetworkStateAsync();
      setNetworkStatus(network.isConnected ? (network.isInternetReachable ? "Connected" : "No Internet") : "Offline");
    } catch (e) {
      setNetworkStatus("Connected");
    }

    // GPS
    if (Platform.OS !== "web") {
      try {
        const gps = await Location.getProviderStatusAsync();
        setGpsStatus(gps.locationServicesEnabled ? "Enabled" : "Disabled");
      } catch (e) {
        setGpsStatus("Enabled");
      }
    } else {
      setGpsStatus("Enabled"); // Simulated GPS status for web demo
    }

    // SMS & Voice SOS (Check saved preference)
    try {
      const settings = await AsyncStorage.getItem("settings");
      if (settings) {
        const s = JSON.parse(settings);
        setSmsServiceActive(s.smsEnabled ?? true);
        setVoiceSosEnabled(s.voiceSosEnabled ?? false);
      }
    } catch (e) {
      setSmsServiceActive(true);
      setVoiceSosEnabled(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadName = async () => {
        try {
          const stored = await AsyncStorage.getItem("user_profile");
          if (stored) {
            const data = JSON.parse(stored);
            if (data.name && data.name.trim().length > 0) {
              setUserName(data.name.trim());
              return;
            }
          }
          setUserName("");
        } catch (err) {
          console.log("Error loading name on home:", err);
        }
      };
      loadName();
      updateSystemStatus();
    }, [updateSystemStatus])
  );

  useEffect(() => {
    updateSystemStatus();
    let batterySub: any = null;

    if (Platform.OS !== "web") {
      try {
        batterySub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryLevel(Math.round(batteryLevel * 100));
        });
      } catch (e) {
        console.log("Battery listener failed:", e);
      }
    }

    return () => {
      if (batterySub) {
        batterySub.remove();
      }
    };
  }, [updateSystemStatus]);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.1, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1) }],
  }));

  const openSettings = (type: 'location' | 'network') => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      if (type === 'location') {
        Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      } else {
        Linking.sendIntent('android.settings.WIFI_SETTINGS');
      }
    }
  };

  const toggleSmsPreference = async () => {
    const newVal = !smsServiceActive;
    setSmsServiceActive(newVal);
    const settings = await AsyncStorage.getItem("settings");
    const s = settings ? JSON.parse(settings) : {};
    await AsyncStorage.setItem("settings", JSON.stringify({ ...s, smsEnabled: newVal }));
  };

  const flashSOS = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required to use the flash.");
        return;
      }

      setIsFlashing(true);

      // S-O-S Pattern (Simplified)
      for (let i = 0; i < 6; i++) {
        setTorchEnabled(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((r) => setTimeout(r, 200));
        setTorchEnabled(false);
        await new Promise((r) => setTimeout(r, 200));
      }

      setIsFlashing(false);
      Alert.alert("Flash SOS 🚨", "Emergency flash signal completed.");
    } catch (error) {
      console.log(error);
      setIsFlashing(false);
      Alert.alert("Error", "Could not activate camera flash.");
    }
  };

  const sendSOS = async () => {
    setShowEmergencyMenu(true);
  };

  const callService = (number: string) => {
    setShowEmergencyMenu(false);
    Linking.openURL(`tel:${number}`);
  };

  const toggleSiren = async () => {
    try {
      const { Audio } = require("expo-av");

      // Ensure audio mode is set for Android (plays even in silent mode)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (isSirenPlaying) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
        }
        setIsSirenPlaying(false);
      } else {
        // Check if Siren is enabled in Settings
        let sirenEnabled = true;
        try {
          const storedSettings = await AsyncStorage.getItem("settings");
          if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            sirenEnabled = parsed.sirenEnabled ?? true;
          }
        } catch (e) {
          console.log("Error reading siren settings:", e);
        }

        const startPlaying = async () => {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: 'https://raw.githubusercontent.com/jxpsert/hecuremote/main/siren.mp3' },
            { shouldPlay: true, isLooping: true, volume: 1.0 }
          );
          setSound(newSound);
          setIsSirenPlaying(true);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        };

        if (!sirenEnabled) {
          Alert.alert(
            "Siren Disabled",
            "Emergency Siren is turned OFF in Settings. Do you want to play it anyway?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Play Siren", onPress: startPlaying }
            ]
          );
        } else {
          await startPlaying();
        }
      }
    } catch (error) {
      console.log("Siren Error:", error);
      Alert.alert(
        "Siren Error",
        "Could not play the siren sound. Please ensure you are connected to the internet and the build is complete."
      );
    }
  };

  const sendLocationUpdate = async () => {
    // This is now handled by the background task
  };

  const stopSOS = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }
      setIsSOSActive(false);

      // Load settings
      let vibrationEnabled = true;
      try {
        const storedSettings = await AsyncStorage.getItem("settings");
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          vibrationEnabled = parsed.vibration ?? true;
        }
      } catch (err) {}

      if (vibrationEnabled) {
        Vibration.vibrate(250);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("SOS Stopped", "Live tracking has been deactivated.");
    } catch (err) {
      console.log("Stop Tracking Error:", err);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  const startBroadcast = async () => {
    setShowEmergencyMenu(false);
    try {
      // Load settings
      let duration = 5;
      let vibrationEnabled = true;
      try {
        const storedSettings = await AsyncStorage.getItem("settings");
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          duration = parsed.countdownDuration ?? 5;
          vibrationEnabled = parsed.vibration ?? true;
        }
      } catch (err) {
        console.log("Error loading countdown setting:", err);
      }

      if (vibrationEnabled) {
        // High-intensity toggle SOS warning vibration
        Vibration.vibrate([0, 400, 150, 400]);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await new Promise((r) => setTimeout(r, 800));
      } else {
        for (let i = 0; i < 3; i++) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      setSending(true);
      for (let i = duration; i >= 1; i--) {
        setCountdown(i);
        if (vibrationEnabled) {
          // Intense countdown tick vibration and heavy haptic feedback
          Vibration.vibrate(180);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(null);
      setSending(false);

      const res = await triggerEmergencySOS();
      if (res.success) {
        setIsSOSActive(true);
        Alert.alert("SOS Sent 🚨", "Emergency message sent. Live background tracking is now active.");
      }
    } catch (error: any) {
      console.log(error);
      setSending(false);
      Alert.alert("Error", error.message || "Failed to send SOS");
    }
  };

  // Web Speech Recognition Loop
  useEffect(() => {
    if (Platform.OS !== "web" || !voiceSosEnabled || sending || isSOSActive) {
      setIsListening(false);
      return;
    }

    let recognition: any = null;
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const lastResultIndex = event.results.length - 1;
          const text = event.results[lastResultIndex][0].transcript.toLowerCase();
          console.log("🎤 Voice recognized text:", text);
          if (text.includes("help") || text.includes("activate") || text.includes("emergency")) {
            console.log("🚨 Voice panic trigger matched!");
            startBroadcast();
          }
        };

        recognition.onend = () => {
          // Restart recognition if still enabled
          if (voiceSosEnabled && !sending && !isSOSActive) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        recognition.start();
        setIsListening(true);
      }
    } catch (err) {
      console.log("Speech recognition init failed:", err);
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
      setIsListening(false);
    };
  }, [voiceSosEnabled, sending, isSOSActive, startBroadcast]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {sending && (
        <Animated.View entering={FadeInUp} style={styles.overlay}>
          <Text style={styles.overlayTitle}>Sending SOS 🚨</Text>
          <Text style={styles.countdown}>{countdown}</Text>
          <Text style={styles.overlayText}>Emergency alert will be sent shortly</Text>
        </Animated.View>
      )}

      {/* Hidden CameraView to control torch */}
      {isFlashing && (
        <CameraView
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          enableTorch={torchEnabled}
          facing="back"
        />
      )}

      {/* EMERGENCY MENU MODAL */}
      <Modal
        visible={showEmergencyMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmergencyMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Emergency Actions</Text>
              <TouchableOpacity onPress={() => setShowEmergencyMenu(false)}>
                <Ionicons name="close-circle" size={32} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.background }]}
              onPress={() => callService("100")}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#EBF5FF' }]}>
                <Ionicons name="shield" size={32} color="#007AFF" />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Call Police</Text>
                <Text style={styles.menuSub}>Instant dial to emergency police (100)</Text>
              </View>
              <Ionicons name="call" size={24} color="#007AFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.background }]}
              onPress={() => callService("108")}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FFF5F5' }]}>
                <Ionicons name="medkit" size={32} color="#E63946" />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Call Ambulance</Text>
                <Text style={styles.menuSub}>Request medical assistance (108)</Text>
              </View>
              <Ionicons name="call" size={24} color="#E63946" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.background }]}
              onPress={() => callService("101")}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FFF8EB' }]}>
                <Ionicons name="flame" size={32} color="#F59E0B" />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Fire Brigade</Text>
                <Text style={styles.menuSub}>Report a fire emergency (101)</Text>
              </View>
              <Ionicons name="call" size={24} color="#F59E0B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.broadcastBtn, { backgroundColor: colors.primary }]}
              onPress={startBroadcast}
            >
              <Ionicons name="radio" size={32} color="#fff" />
              <Text style={styles.broadcastText}>Broadcast SOS</Text>
            </TouchableOpacity>

            <Text style={[styles.modalFooter, { color: colors.subText }]}>
              Please only use these in real emergencies.
            </Text>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* PREMIUM HEADER */}
        <Animated.View entering={FadeInDown.springify().damping(15).stiffness(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>Stay Safe Today</Text>
          </View>
          <View style={[styles.profileCircle, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
          </View>
        </Animated.View>

        {/* SOS CARD */}
        <Animated.View entering={FadeInUp.springify().damping(15).delay(200)} style={[styles.sosCard, { backgroundColor: colors.card }]}>
          <View style={styles.sosInfo}>
            <Text style={[styles.sosTitle, { color: isSOSActive ? "#E63946" : colors.text }]}>
              {isSOSActive ? "SOS ACTIVE 🚨" : "Emergency SOS"}
            </Text>
            <Text style={[styles.sosDesc, { color: colors.subText }]}>
              {isSOSActive ? "Sharing live location every 5 mins" : "Instantly alert contacts & share location"}
            </Text>
          </View>

          <View style={styles.sosButtonContainer}>
            <Animated.View style={[styles.pulseRing, animatedPulseStyle, { backgroundColor: isSOSActive ? "#E63946" : colors.primary }]} />
            <Animated.View style={[styles.pulseRing2, animatedPulseStyle, { backgroundColor: isSOSActive ? "#E63946" : colors.primary, opacity: 0.2 }]} />
            <TouchableOpacity
              style={[styles.sosButton, { shadowColor: isSOSActive ? "#E63946" : colors.primary, backgroundColor: isSOSActive ? "#E63946" : "#E63946" }]}
              onPress={isSOSActive ? stopSOS : sendSOS}
              activeOpacity={0.9}
            >
              <Text style={styles.sosText}>{isSOSActive ? "STOP" : "SOS"}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* AI CRASH GUARD CARD */}
        <Animated.View entering={FadeInUp.springify().damping(15).delay(300)} style={[styles.aiCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.aiCardContent}
            onPress={() => router.push("/accident-detection")}
            activeOpacity={0.8}
          >
            <View style={styles.aiLeft}>
              <View style={[styles.radarIconBg, { backgroundColor: isDetectionEnabled ? "rgba(239, 68, 68, 0.1)" : colors.accent }]}>
                <Ionicons name="shield-checkmark" size={26} color={isDetectionEnabled ? "#EF4444" : colors.subText} />
              </View>
              <View style={styles.aiTextContainer}>
                <Text style={[styles.aiTitle, { color: colors.text }]}>AI Crash & Fall Guard</Text>
                <Text style={[styles.aiDesc, { color: colors.subText }]}>
                  {isDetectionEnabled ? `Active • ${activityMode === "Vehicle" ? "Driving Mode" : "Walking Mode"}` : "Paused • Tap to configure"}
                </Text>
              </View>
            </View>
            <View style={styles.aiRight}>
              {isDetectionEnabled && (
                <View style={styles.pulsingLight} />
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.subText} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* VOICE SOS STATUS CARD */}
        {voiceSosEnabled && (
          <Animated.View entering={FadeInUp.springify().damping(15).delay(350)} style={[styles.aiCard, { backgroundColor: colors.card, marginTop: 12 }]}>
            <TouchableOpacity
              style={styles.aiCardContent}
              onPress={Platform.OS !== "web" ? startBroadcast : undefined}
              activeOpacity={0.8}
            >
              <View style={styles.aiLeft}>
                <View style={[styles.radarIconBg, { backgroundColor: isListening || Platform.OS !== "web" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }]}>
                  <Ionicons name={isListening || Platform.OS !== "web" ? "mic" : "mic-off"} size={26} color={isListening || Platform.OS !== "web" ? "#10B981" : "#EF4444"} />
                </View>
                <View style={styles.aiTextContainer}>
                  <Text style={[styles.aiTitle, { color: colors.text }]}>Voice SOS Trigger</Text>
                  <Text style={[styles.aiDesc, { color: colors.subText }]}>
                    {Platform.OS === "web" 
                      ? (isListening ? '🎙️ Listening... Say "Help Help"' : '⚠️ Microphone permission required')
                      : '🎙️ Active • Tap to simulate voice activation'}
                  </Text>
                </View>
              </View>
              <View style={styles.aiRight}>
                {(isListening || Platform.OS !== "web") && (
                  <View style={[styles.pulsingLight, { backgroundColor: "#10B981" }]} />
                )}
                {Platform.OS !== "web" && (
                  <Ionicons name="play" size={18} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* QUICK ACTIONS */}
        <Animated.Text entering={FadeInUp.duration(500).delay(400)} style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Animated.Text>

        <View style={styles.grid}>
          <Animated.View entering={FadeInUp.duration(500).delay(500)} style={{ width: "48%" }}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]} onPress={() => router.push("/history")}>
              <Ionicons name="time-outline" size={32} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>History</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(600)} style={{ width: "48%" }}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]} onPress={() => router.push("/location")}>
              <Ionicons name="location-outline" size={32} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Location</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(700)} style={{ width: "48%" }}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]} onPress={flashSOS}>
              <Ionicons name="flash-outline" size={32} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Flash SOS</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(800)} style={{ width: "48%" }}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: isSirenPlaying ? '#FFEDED' : colors.card, borderColor: isSirenPlaying ? '#FF0000' : 'transparent', borderWidth: isSirenPlaying ? 2 : 0 }]}
              onPress={toggleSiren}
            >
              <Ionicons name={isSirenPlaying ? "volume-high" : "megaphone-outline"} size={32} color={isSirenPlaying ? "#FF0000" : colors.primary} />
              <Text style={[styles.actionText, { color: isSirenPlaying ? "#FF0000" : colors.text }]}>Siren</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(900)} style={{ width: "48%" }}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]} onPress={() => router.push("/chat")}>
              <Ionicons name="medkit-outline" size={32} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>First-Aid AI</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(1000)} style={{ width: "48%" }}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]} onPress={() => router.push("/hospitals")}>
              <Ionicons name="business-outline" size={32} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Hospitals</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* STATUS CARD */}
        <Animated.Text entering={FadeInUp.duration(500).delay(900)} style={[styles.sectionTitle, { color: colors.text }]}>
          System Status
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(500).delay(1000)} style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Ionicons name="battery-charging" size={20} color={batteryLevel && batteryLevel < 20 ? "#E11D48" : colors.subText} />
              <View>
                <Text style={[styles.statusText, { color: colors.text }]}>Phone Battery</Text>
                {batteryLevel !== null && batteryLevel < 20 && (
                  <Text style={{ color: "#E11D48", fontSize: 11, fontWeight: "700", marginTop: 2 }}>Emergency tracking may stop</Text>
                )}
              </View>
            </View>
            <Text style={[styles.statusValue, { color: batteryLevel && batteryLevel < 20 ? "#E11D48" : colors.primary }]}>
              {batteryLevel !== null ? `${batteryLevel}%` : "--"}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.statusRow} onPress={() => openSettings('location')}>
            <View style={styles.statusLeft}>
              <Ionicons name="navigate-circle" size={20} color={gpsStatus === "Enabled" ? colors.success : "#E11D48"} />
              <Text style={[styles.statusText, { color: colors.text }]}>GPS Location</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={[styles.active, gpsStatus !== "Enabled" && { color: "#E11D48", backgroundColor: "#FFF1F2" }]}>
                {gpsStatus}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.subText} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.statusRow} onPress={() => openSettings('network')}>
            <View style={styles.statusLeft}>
              <Ionicons name="wifi" size={20} color={networkStatus === "Connected" ? colors.success : "#E11D48"} />
              <Text style={[styles.statusText, { color: colors.text }]}>Network</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={[styles.active, networkStatus !== "Connected" && { color: "#E11D48", backgroundColor: "#FFF1F2" }]}>
                {networkStatus}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.subText} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.statusRow} onPress={toggleSmsPreference}>
            <View style={styles.statusLeft}>
              <Ionicons name="chatbubble-ellipses" size={20} color={smsServiceActive ? colors.success : "#E11D48"} />
              <Text style={[styles.statusText, { color: colors.text }]}>SMS Service</Text>
            </View>
            <Switch
              value={smsServiceActive}
              onValueChange={toggleSmsPreference}
              trackColor={{ false: "#E2E8F0", true: "#FB7185" }}
              thumbColor={smsServiceActive ? "#E11D48" : "#94A3B8"}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Ionicons name="radio" size={20} color={isSOSActive ? colors.success : colors.subText} />
              <Text style={[styles.statusText, { color: colors.text }]}>Live Tracking</Text>
            </View>
            <Text style={[styles.active, !isSOSActive && { color: colors.subText, backgroundColor: colors.accent }]}>
              {isSOSActive ? "ACTIVE" : "INACTIVE"}
            </Text>
          </View>
        </Animated.View>

        {/* SAFETY TIP */}
        <Animated.View entering={FadeInUp.duration(500).delay(1100)} style={[styles.tipCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={[styles.tipTitle, { color: colors.primary }]}>Safety Tip</Text>
          </View>
          <Text style={[styles.tipText, { color: colors.subText }]}>
            Keep your emergency contacts updated so alerts reach the right people during emergencies.
          </Text>
        </Animated.View>

        <View style={{ height: 150 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(225, 29, 72, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  overlayTitle: { color: "#fff", fontSize: 36, fontWeight: "900", marginBottom: 20 },
  countdown: { color: "#fff", fontSize: 160, fontWeight: "900" },
  overlayText: { color: "#fff", fontSize: 18, marginTop: 20, fontWeight: "600", opacity: 0.8 },
  header: {
    backgroundColor: "#E11D48",
    paddingTop: 80,
    paddingBottom: 70,
    paddingHorizontal: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  greeting: { color: "rgba(255,255,255,0.8)", fontSize: 18, fontWeight: "600" },
  name: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4, letterSpacing: -1 },
  profileCircle: {
    width: 60, height: 60, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
  },
  sosCard: {
    marginHorizontal: 20,
    marginTop: -50,
    borderRadius: 40,
    padding: 30,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.15,
    shadowRadius: 35,
    elevation: 15,
  },
  sosInfo: {
    flex: 1,
    marginRight: 15,
  },
  sosTitle: { fontSize: 26, fontWeight: "900", letterSpacing: -0.8, marginBottom: 6 },
  sosDesc: { lineHeight: 20, fontSize: 14, fontWeight: "500", opacity: 0.8 },
  sosButtonContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  pulseRing2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  sosButton: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#E11D48",
    justifyContent: "center", alignItems: "center",
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 15,
    borderWidth: 5, borderColor: 'rgba(255,255,255,0.3)',
  },
  sosText: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 1.5 },
  sectionTitle: { fontSize: 24, fontWeight: "900", marginHorizontal: 20, marginTop: 35, marginBottom: 20, letterSpacing: -0.8 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20 },
  actionCard: {
    paddingVertical: 24,
    borderRadius: 32,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  actionText: { marginTop: 12, fontWeight: "900", fontSize: 15, letterSpacing: -0.4 },
  statusCard: {
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4,
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusText: { fontSize: 16, fontWeight: "700" },
  statusValue: { fontSize: 16, fontWeight: "900" },
  active: { color: "#059669", fontWeight: "900", backgroundColor: "#ECFDF5", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: "hidden", fontSize: 13 },
  divider: { height: 1.5, marginVertical: 2 },
  tipCard: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  tipTitle: { fontSize: 18, fontWeight: "900" },
  tipText: { lineHeight: 24, fontSize: 15, fontWeight: "500", opacity: 0.8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    padding: 30,
    paddingBottom: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    borderRadius: 28,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  menuIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: 20,
  },
  menuLabel: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  menuSub: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
    opacity: 0.7,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    borderRadius: 28,
    gap: 15,
    marginTop: 15,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  broadcastText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  modalFooter: {
    textAlign: 'center',
    marginTop: 25,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
  },
  aiCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  aiCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  aiLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radarIconBg: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  aiTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  aiTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  aiDesc: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  aiRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pulsingLight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34C759",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
