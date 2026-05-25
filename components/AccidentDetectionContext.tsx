import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { triggerEmergencySOS } from "../utils/emergencyHelper";
import { Platform } from "react-native";

export type SensitivityLevel = "Low" | "Standard" | "High";
export type DetectionMode = "Vehicle" | "Walking";

interface AccidentDetectionContextType {
  isDetectionEnabled: boolean;
  sensitivity: SensitivityLevel;
  activityMode: DetectionMode;
  liveGForce: number;
  liveAxes: { x: number; y: number; z: number };
  isAlertCountdownActive: boolean;
  alertCountdown: number;
  setDetectionEnabled: (val: boolean) => Promise<void>;
  setSensitivity: (val: SensitivityLevel) => Promise<void>;
  setActivityMode: (val: DetectionMode) => Promise<void>;
  triggerSimulatedImpact: () => void;
  cancelAlertCountdown: () => void;
  isTriggeringSOS: boolean;
}

const AccidentDetectionContext = createContext<AccidentDetectionContextType | undefined>(undefined);

export const AccidentDetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(true);
  const [sensitivity, setSensitivityState] = useState<SensitivityLevel>("Standard");
  const [activityMode, setActivityModeState] = useState<DetectionMode>("Vehicle");

  // Real-time telemetry
  const [liveGForce, setLiveGForce] = useState(1.0);
  const [liveAxes, setLiveAxes] = useState({ x: 0, y: 0, z: 1 });

  // Alert State Machine
  const [isAlertCountdownActive, setIsAlertCountdownActive] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(15);
  const [isTriggeringSOS, setIsTriggeringSOS] = useState(false);

  // References for loops
  const countdownIntervalRef = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const hapticIntervalRef = useRef<any>(null);
  const lastImpactTime = useRef<number>(0);
  const lastTelemetryUpdate = useRef<number>(0);

  // Load preferences on start
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const saved = await AsyncStorage.getItem("accident_detection_settings");
        if (saved) {
          const config = JSON.parse(saved);
          setIsDetectionEnabled(config.isDetectionEnabled ?? true);
          setSensitivityState(config.sensitivity ?? "Standard");
          setActivityModeState(config.activityMode ?? "Vehicle");
        }
      } catch (err) {
        console.log("Error loading accident detection prefs:", err);
      }
    };
    loadPreferences();
  }, []);

  // Save utility
  const savePreferences = async (newConfig: any) => {
    try {
      await AsyncStorage.setItem("accident_detection_settings", JSON.stringify(newConfig));
    } catch (err) {
      console.log("Error saving accident detection prefs:", err);
    }
  };

  const setDetectionEnabled = async (val: boolean) => {
    setIsDetectionEnabled(val);
    await savePreferences({ isDetectionEnabled: val, sensitivity, activityMode });
  };

  const setSensitivity = async (val: SensitivityLevel) => {
    setSensitivityState(val);
    await savePreferences({ isDetectionEnabled, sensitivity: val, activityMode });
  };

  const setActivityMode = async (val: DetectionMode) => {
    setActivityModeState(val);
    await savePreferences({ isDetectionEnabled, sensitivity, activityMode: val });
  };

  // Warning Sound & Haptics Player
  const startEmergencyAlarm = async () => {
    try {
      // Audio setup
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

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

      if (sirenEnabled) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://raw.githubusercontent.com/jxpsert/hecuremote/main/siren.mp3' },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
      }

      // Haptic warning loop
      hapticIntervalRef.current = setInterval(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 1000);

    } catch (err) {
      console.log("Alarm Audio Error:", err);
    }
  };

  const stopEmergencyAlarm = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }
    } catch (err) {
      console.log("Stop Alarm Error:", err);
    }
  };

  // Trigger Countdown Overlay
  const startCountdown = () => {
    if (isAlertCountdownActive) return;
    setIsAlertCountdownActive(true);
    setAlertCountdown(15);
    startEmergencyAlarm();

    countdownIntervalRef.current = setInterval(() => {
      setAlertCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          // Trigger automatic SOS!
          handleAutoSOSTrigger();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelAlertCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsAlertCountdownActive(false);
    setIsTriggeringSOS(false);
    stopEmergencyAlarm();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAutoSOSTrigger = async () => {
    setIsTriggeringSOS(true);
    stopEmergencyAlarm();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const res = await triggerEmergencySOS();
      console.log("Automatic AI Accident SOS result:", res);
    } catch (err) {
      console.log("Automatic SOS Trigger Error:", err);
    } finally {
      setIsAlertCountdownActive(false);
      setIsTriggeringSOS(false);
    }
  };

  // Trigger Simulated Crash Event
  const triggerSimulatedImpact = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    startCountdown();
  };

  // Real-time sensor processing loop
  useEffect(() => {
    let subscription: any = null;
    let webTimer: any = null;

    if (isDetectionEnabled && !isAlertCountdownActive) {
      if (Platform.OS !== "web") {
        Accelerometer.setUpdateInterval(50); // 20 times per second for telemetry, very responsive

        subscription = Accelerometer.addListener((data) => {
          // Expo Accelerometer raw axes are in G units
          const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);

          // Throttle React state updates to 4Hz (every 250ms) to prevent render queue overload
          const nowTime = Date.now();
          if (nowTime - lastTelemetryUpdate.current > 250) {
            lastTelemetryUpdate.current = nowTime;
            setLiveGForce(parseFloat(magnitude.toFixed(2)));
            setLiveAxes({
              x: parseFloat(data.x.toFixed(3)),
              y: parseFloat(data.y.toFixed(3)),
              z: parseFloat(data.z.toFixed(3)),
            });
          }

          // Determine G-force threshold based on Mode & Sensitivity
          let threshold = activityMode === "Vehicle" ? 4.5 : 2.5;
          if (sensitivity === "High") {
            threshold -= 0.8;
          } else if (sensitivity === "Low") {
            threshold += 1.0;
          }

          // Avoid multiple quick triggers
          const now = Date.now();
          if (magnitude > threshold && now - lastImpactTime.current > 10000) {
            lastImpactTime.current = now;
            console.log(`💥 Edge AI crash alert! G-Force: ${magnitude.toFixed(2)}G (Threshold: ${threshold}G)`);
            startCountdown();
          }
        });
      } else {
        // Web telemetry simulation: float values gently around 1.00G
        webTimer = setInterval(() => {
          const dx = (Math.random() - 0.5) * 0.05;
          const dy = (Math.random() - 0.5) * 0.05;
          const dz = 1.0 + (Math.random() - 0.5) * 0.05;
          const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
          setLiveGForce(parseFloat(magnitude.toFixed(2)));
          setLiveAxes({
            x: parseFloat(dx.toFixed(3)),
            y: parseFloat(dy.toFixed(3)),
            z: parseFloat(dz.toFixed(3)),
          });
        }, 1000);
      }
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (webTimer) {
        clearInterval(webTimer);
      }
    };
  }, [isDetectionEnabled, sensitivity, activityMode, isAlertCountdownActive]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <AccidentDetectionContext.Provider
      value={{
        isDetectionEnabled,
        sensitivity,
        activityMode,
        liveGForce,
        liveAxes,
        isAlertCountdownActive,
        alertCountdown,
        setDetectionEnabled,
        setSensitivity,
        setActivityMode,
        triggerSimulatedImpact,
        cancelAlertCountdown,
        isTriggeringSOS,
      }}
    >
      {children}
    </AccidentDetectionContext.Provider>
  );
};

export const useAccidentDetection = () => {
  const context = useContext(AccidentDetectionContext);
  if (!context) {
    throw new Error("useAccidentDetection must be used within an AccidentDetectionProvider");
  }
  return context;
};
