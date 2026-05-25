import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import { Alert } from "react-native";
import { push, ref } from "firebase/database";
import { db } from "../firebaseConfig";

export const LOCATION_TRACKING = 'location-tracking';

export interface SOSResult {
  success: boolean;
  message?: string;
}

/**
 * Triggers the core emergency SOS pipeline:
 * 1. Obtains/Requests location permissions.
 * 2. Fetches GPS coordinates.
 * 3. Logs the emergency to the Firebase Realtime Database.
 * 4. Loads emergency contacts from AsyncStorage.
 * 5. Sends automatic emergency SMS with coordinates.
 * 6. Starts background high-accuracy location tracking.
 */
export async function triggerEmergencySOS(): Promise<SOSResult> {
  try {
    // 1. Location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location permission is required to broadcast SOS.");
      return { success: false, message: "Location permission denied" };
    }

    // 2. Fetch current coordinates
    let location;
    try {
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (locErr) {
      location = await Location.getLastKnownPositionAsync({});
    }

    if (!location) {
      Alert.alert("Location Error", "Could not fetch location. Please ensure GPS is active.");
      return { success: false, message: "Could not fetch GPS coordinates" };
    }

    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

    // 3. Push to Firebase tracking and logs
    const timestampStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    await push(ref(db, "emergencies"), {
      latitude,
      longitude,
      time: Date.now(),
      isAutomaticCrashDetect: true,
    });

    await push(ref(db, "emergency_logs"), {
      type: "Emergency SOS",
      timestamp: timestampStr,
      time: Date.now(),
      location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      status: "Alerted",
      latitude,
      longitude
    });

    // 4. Fetch patient medical & insurance details for SMS broadcast
    let profileData: any = {};
    let medicalData: any = {};
    let insuranceData: any = {};

    try {
      const storedProf = await AsyncStorage.getItem("user_profile");
      if (storedProf) profileData = JSON.parse(storedProf);

      const storedMed = await AsyncStorage.getItem("user_medical_history");
      if (storedMed) medicalData = JSON.parse(storedMed);

      const storedIns = await AsyncStorage.getItem("user_insurance");
      if (storedIns) insuranceData = JSON.parse(storedIns);
    } catch (e) {
      console.log("Error loading details for SOS message:", e);
    }

    // Build the medical summary text
    let medicalSection = "";
    if (profileData.name) {
      medicalSection += `👤 Patient: ${profileData.name}\n`;
    }
    if (profileData.bloodType && profileData.bloodType !== "Not Set") {
      medicalSection += `🩸 Blood Group: ${profileData.bloodType}\n`;
    }
    if (profileData.allergies && profileData.allergies !== "Not Set") {
      medicalSection += `⚠️ Allergies: ${profileData.allergies}\n`;
    }
    if (medicalData.conditions && medicalData.conditions.length > 0) {
      medicalSection += `🏥 Conditions: ${medicalData.conditions.join(", ")}\n`;
    }
    if (medicalData.medications && medicalData.medications.length > 0) {
      medicalSection += `💊 Meds: ${medicalData.medications.join(", ")}\n`;
    }
    if (insuranceData.provider && insuranceData.policyNumber) {
      medicalSection += `🛡️ Ins: ${insuranceData.provider} (${insuranceData.policyNumber})\n`;
    }

    // 5. Fetch contacts
    const savedContacts = await AsyncStorage.getItem("contacts");
    const contacts = savedContacts ? JSON.parse(savedContacts) : [];
    const phoneNumbers = contacts
      .map((c: any) => {
        if (typeof c === "string") return c.trim();
        if (c && typeof c === "object" && typeof c.phone === "string") return c.phone.trim();
        return null;
      })
      .filter(Boolean) as string[];

    if (phoneNumbers.length === 0) {
      Alert.alert(
        "SOS Triggered 🚨",
        "Emergency logged to cloud. However, no emergency contacts were found. Please configure them in the Contacts tab."
      );
    } else {
      // 6. Send SMS with Location & Medical Details
      const smsMessage = `🚨 CRITICAL EMERGENCY ALERT\n\nAn emergency has been triggered!\n\n${medicalSection}\n📍 Live Location:\nhttps://maps.google.com/?q=${latitude},${longitude}`;

      const smsAvailable = await SMS.isAvailableAsync();
      if (!smsAvailable) {
        console.log("SMS service is not available on this device.");
      } else {
        await SMS.sendSMSAsync(phoneNumbers, smsMessage);
      }
    }

    // 6. Alert feedback haptics
    const settingsData = await AsyncStorage.getItem("settings");
    const settings = settingsData ? JSON.parse(settingsData) : { vibration: true };
    const isVibrationEnabled = settings.vibration !== false;

    for (let i = 0; i < 3; i++) {
      if (isVibrationEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    // 7. Initialize background tracking
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus === 'granted') {
      try {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
        if (!hasStarted) {
          await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5 * 60 * 1000, // 5 minutes
            distanceInterval: 10, // 10 meters
            foregroundService: {
              notificationTitle: "Emergency SOS Active",
              notificationBody: "Sharing your live location with emergency contacts.",
              notificationColor: "#E63946",
            },
          });
        }
      } catch (trackErr) {
        console.log("Error starting background tracking:", trackErr);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("SOS Pipeline Error:", error);
    Alert.alert("SOS Error", error.message || "Failed to complete SOS broadcast.");
    return { success: false, message: error.message };
  }
}
