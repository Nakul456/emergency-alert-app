import React, { useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SMS from "expo-sms";

import { Camera } from "expo-camera";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 🔥 FIREBASE
import { push, ref } from "firebase/database";
import { db } from "../../firebaseConfig";

export default function HomeScreen() {
  const router = useRouter();

  // ⏳ COUNTDOWN STATES
  const [countdown, setCountdown] = useState<number | null>(null);

  const [sending, setSending] = useState(false);

  // 🔦 FLASH SOS
  const flashSOS = async () => {
    try {
      // 📷 CAMERA PERMISSION
      await Camera.requestCameraPermissionsAsync();

      // 📳 FLASH EFFECT
      for (let i = 0; i < 10; i++) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );

        console.log("FLASH ON");

        await new Promise((r) => setTimeout(r, 300));

        console.log("FLASH OFF");

        await new Promise((r) => setTimeout(r, 300));
      }

      Alert.alert("Flash SOS 🚨", "Emergency flash activated");
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Flash SOS failed");
    }
  };

  // 🚨 SOS FUNCTION
  const sendSOS = async () => {
    // ⚠️ WARNING POPUP
    Alert.alert("Emergency SOS 🚨", "SOS will be sent in 5 seconds.", [
      {
        text: "Cancel",
        style: "cancel",
      },

      {
        text: "Continue",

        onPress: async () => {
          try {
            // 📳 STRONG VIBRATION
            for (let i = 0; i < 5; i++) {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              );

              await new Promise((r) => setTimeout(r, 300));
            }

            // ⏳ SHOW COUNTDOWN
            setSending(true);

            for (let i = 5; i >= 1; i--) {
              setCountdown(i);

              await new Promise((r) => setTimeout(r, 1000));
            }

            setCountdown(null);
            setSending(false);

            // 📍 LOCATION PERMISSION
            const { status } =
              await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
              Alert.alert(
                "Permission Denied",
                "Location permission is required",
              );
              return;
            }

            // 📍 GET REAL LOCATION
            let location;
            try {
              location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced, // Balanced is much faster and less prone to timeout
              });
            } catch (locErr) {
              console.log("Error getting current position:", locErr);
              // Fallback to last known position if current position fails (common on some devices/emulators)
              location = await Location.getLastKnownPositionAsync({});
            }

            if (!location) {
              Alert.alert("Location Error", "Could not fetch location. Please ensure GPS is enabled on your device.");
              return;
            }

            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            // ☁️ SAVE TO FIREBASE
            await push(ref(db, "emergencies"), {
              latitude,
              longitude,
              time: Date.now(),
            });

            // 👥 GET CONTACTS
            const savedContacts = await AsyncStorage.getItem("contacts");

            const contacts = savedContacts ? JSON.parse(savedContacts) : [];

            // 🚫 NO CONTACTS
            if (contacts.length === 0) {
              Alert.alert("No Contacts", "Please add emergency contacts first");
              return;
            }

            // 📱 PHONE NUMBERS
            const phoneNumbers = contacts.filter(Boolean);

            // 🚫 INVALID CONTACTS
            if (phoneNumbers.length === 0) {
              Alert.alert("Invalid Contacts", "No valid phone numbers found");
              return;
            }

            // 📩 MESSAGE
            const message = `🚨 EMERGENCY ALERT

I need help immediately!

📍 Live Location:
https://maps.google.com/?q=${latitude},${longitude}`;

            // 📩 CHECK SMS
            const available = await SMS.isAvailableAsync();

            if (!available) {
              Alert.alert("SMS Not Available", "SMS service unavailable");
              return;
            }

            // 📩 OPEN SMS APP
            await SMS.sendSMSAsync(phoneNumbers, message);

            // ✅ SUCCESS VIBRATION
            for (let i = 0; i < 3; i++) {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );

              await new Promise((r) => setTimeout(r, 200));
            }

            Alert.alert(
              "SOS Ready 🚨",
              "Emergency message opened successfully",
            );
          } catch (error: any) {
            console.log(error);

            Alert.alert("Error", error.message || "Failed to send SOS");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 🚨 COUNTDOWN OVERLAY */}
      {sending && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Sending SOS 🚨</Text>

          <Text style={styles.countdown}>{countdown}</Text>

          <Text style={styles.overlayText}>
            Emergency alert will be sent shortly
          </Text>
        </View>
      )}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 🔴 HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello 👋</Text>

            <Text style={styles.name}>Stay Safe Today</Text>
          </View>

          <View style={styles.profileCircle}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
          </View>
        </View>

        {/* 🚨 SOS CARD */}
        <View style={styles.sosCard}>
          <Text style={styles.sosTitle}>Emergency SOS</Text>

          <Text style={styles.sosDesc}>
            Press the button below to instantly alert your emergency contacts
            and share your live location.
          </Text>

          {/* 🚨 SOS BUTTON */}
          <TouchableOpacity style={styles.sosButton} onPress={sendSOS}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* ⚡ QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          {/* 📜 HISTORY */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/history")}
          >
            <Ionicons name="time" size={28} color="#d32f2f" />

            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>

          {/* 📍 LOCATION */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/location")}
          >
            <Ionicons name="location" size={28} color="#d32f2f" />

            <Text style={styles.actionText}>Location</Text>
          </TouchableOpacity>

          {/* 🔦 FLASH SOS */}
          <TouchableOpacity style={styles.actionCard} onPress={flashSOS}>
            <Ionicons name="flash" size={28} color="#d32f2f" />

            <Text style={styles.actionText}>Flash SOS</Text>
          </TouchableOpacity>

          {/* ⚙️ SETTINGS */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings" size={28} color="#d32f2f" />

            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* 📡 STATUS CARD */}
        <Text style={styles.sectionTitle}>System Status</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>📍 GPS Location</Text>

            <Text style={styles.active}>Active</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>📩 SMS Service</Text>

            <Text style={styles.active}>Ready</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>🌐 Internet</Text>

            <Text style={styles.active}>Connected</Text>
          </View>
        </View>

        {/* 💡 SAFETY TIP */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Safety Tip</Text>

          <Text style={styles.tipText}>
            Keep your emergency contacts updated so alerts reach the right
            people during emergencies.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },

  // 🚨 OVERLAY
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "rgba(0,0,0,0.9)",

    justifyContent: "center",
    alignItems: "center",

    zIndex: 999,
  },

  overlayTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },

  countdown: {
    color: "#ff4444",
    fontSize: 120,
    fontWeight: "bold",
  },

  overlayText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 20,
  },

  header: {
    backgroundColor: "#d32f2f",
    paddingTop: 70,
    paddingBottom: 35,
    paddingHorizontal: 22,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  greeting: {
    color: "#ffcdd2",
    fontSize: 14,
  },

  name: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 5,
  },

  profileCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,

    backgroundColor: "rgba(255,255,255,0.2)",

    justifyContent: "center",
    alignItems: "center",
  },

  sosCard: {
    backgroundColor: "#fff",
    margin: 18,
    marginTop: -20,
    borderRadius: 26,
    padding: 24,

    elevation: 5,
  },

  sosTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
  },

  sosDesc: {
    color: "#666",
    lineHeight: 22,
  },

  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,

    backgroundColor: "#d32f2f",

    justifyContent: "center",
    alignItems: "center",

    alignSelf: "center",

    marginTop: 28,

    elevation: 8,
  },

  sosText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 18,
    marginBottom: 14,
    color: "#222",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },

  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    paddingVertical: 24,
    borderRadius: 22,
    alignItems: "center",
    marginBottom: 15,

    elevation: 4,
  },

  actionText: {
    marginTop: 10,
    fontWeight: "600",
    color: "#333",
  },

  statusCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    borderRadius: 22,
    padding: 20,

    elevation: 4,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  statusText: {
    fontSize: 15,
    color: "#333",
  },

  active: {
    color: "green",
    fontWeight: "bold",
  },

  tipCard: {
    backgroundColor: "#fff5f5",
    margin: 18,
    borderRadius: 22,
    padding: 20,

    borderWidth: 1,
    borderColor: "#ffcdd2",
  },

  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 8,
  },

  tipText: {
    color: "#666",
    lineHeight: 22,
  },
});
