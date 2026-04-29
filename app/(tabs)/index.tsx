import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ref, set } from "firebase/database";
import { db } from "../../firebaseConfig";

export default function HomeScreen() {
  const router = useRouter();

  const handleSOS = async () => {
    try {
      // 1️⃣ Permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied");
        return;
      }

      // 2️⃣ Get location
      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // 3️⃣ Save to Firebase
      const id = Date.now();
      await set(ref(db, "emergencies/" + id), {
        latitude,
        longitude,
        time: new Date().toISOString(),
      });

      // 4️⃣ Get contacts
      const stored = await AsyncStorage.getItem("contacts");
      console.log("RAW:", stored);
      const contacts = stored ? JSON.parse(stored) : [];

      console.log("Contacts:", contacts);

      if (contacts.length === 0) {
        Alert.alert("No contacts found");
        return;
      }

      // 5️⃣ Prepare SMS message
      const message = `🚨 Emergency! I need help.\nhttps://maps.google.com/?q=${latitude},${longitude}`;

      // 6️⃣ Open SMS app (guaranteed method)
      const url = `sms:${contacts.join(",")}?body=${encodeURIComponent(
        message,
      )}`;

      console.log("Opening SMS URL:", url);

      await Linking.openURL(url);

      Alert.alert("🚨 Alert Ready", "SMS app opened");
    } catch (err) {
      console.log("Error:", err);
      Alert.alert("Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔴 Top */}
      <View style={styles.top}>
        <Text style={styles.title}>EMERGENCY ALERT</Text>

        <TouchableOpacity style={styles.sos} onPress={handleSOS}>
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>

        <Text style={styles.sub}>Sends alert to all emergency contacts</Text>
      </View>

      {/* ⚪ Card */}
      <View style={styles.card}>
        <TouchableOpacity onPress={() => router.push("/location" as any)}>
          <Text style={styles.item}>📍 My Location</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/history" as any)}>
          <Text style={styles.item}>📜 History</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("contacts" as any)}>
          <Text style={styles.item}>👤 Emergency Contacts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#d32f2f" },

  top: { alignItems: "center", marginTop: 60 },

  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
  },

  sos: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  sosText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },

  sub: {
    color: "#fff",
    marginTop: 20,
  },

  card: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 20,
    padding: 15,
  },

  item: {
    fontSize: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
