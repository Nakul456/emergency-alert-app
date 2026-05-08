import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [blood, setBlood] = useState("");
  const [note, setNote] = useState("");

  // ⚙️ Settings state
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("profile").then((data) => {
      if (data) {
        const p = JSON.parse(data);
        setName(p.name || "");
        setPhone(p.phone || "");
        setBlood(p.blood || "");
        setNote(p.note || "");
      }
    });
  }, []);

  const saveProfile = async () => {
    await AsyncStorage.setItem(
      "profile",
      JSON.stringify({ name, phone, blood, note }),
    );
    Alert.alert("✅ Saved", "Profile updated successfully");
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🔴 HEADER */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name[0].toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.headerName}>{name || "Your Name"}</Text>
        <Text style={styles.headerPhone}>{phone || "+91XXXXXXXXXX"}</Text>
      </View>

      {/* 👤 PERSONAL INFO */}
      <View style={styles.card}>
        <Text style={styles.section}>👤 Personal Info</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Phone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      {/* 🚨 EMERGENCY INFO */}
      <View style={styles.card}>
        <Text style={styles.section}>🚨 Emergency Info</Text>

        <Text style={styles.label}>Blood Group</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. B+, O-, A+"
          value={blood}
          onChangeText={setBlood}
        />

        <Text style={styles.label}>Medical Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Allergies, conditions, medications..."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* ⚙️ SETTINGS */}
      <View style={styles.card}>
        <Text style={styles.section}>⚙️ Settings</Text>

        <View style={styles.row}>
          <Text style={styles.settingText}>🌙 Dark Mode</Text>

          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      {/* 💾 SAVE BUTTON */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
          <Text style={styles.saveText}>💾 Save Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ℹ️ ABOUT */}
      <View style={styles.card}>
        <Text style={styles.section}>ℹ️ About</Text>
        <Text style={styles.about}>
          Emergency Alert App{"\n"}
          Version 1.0.0{"\n"}
          Fast response in critical situations.
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },

  header: {
    backgroundColor: "#d32f2f",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#d32f2f",
  },

  headerName: {
    marginTop: 10,
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  headerPhone: {
    color: "#fff",
    marginTop: 5,
    opacity: 0.9,
  },

  card: {
    backgroundColor: "#fff",
    margin: 15,
    marginBottom: 0,
    borderRadius: 20,
    padding: 18,
    elevation: 4,
  },

  section: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    marginBottom: 5,
    color: "#555",
  },

  input: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    fontSize: 14,
  },

  multiline: {
    height: 80,
    textAlignVertical: "top",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  settingText: {
    fontSize: 14,
    color: "#333",
  },

  saveBtn: {
    backgroundColor: "#d32f2f",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  about: {
    color: "#666",
    lineHeight: 22,
    fontSize: 13,
  },
});
