import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await AsyncStorage.getItem("settings");
      if (data) {
        const s = JSON.parse(data);
        setSmsEnabled(s.smsEnabled ?? true);
        setVibration(s.vibration ?? true);
        setDarkMode(s.darkMode ?? false);
      }
    };
    load();
  }, []);

  const save = async (newSettings: any) => {
    await AsyncStorage.setItem("settings", JSON.stringify(newSettings));
  };

  const toggleSMS = () => {
    const updated = !smsEnabled;
    setSmsEnabled(updated);
    save({ smsEnabled: updated, vibration, darkMode });
  };

  const toggleVibration = () => {
    const updated = !vibration;
    setVibration(updated);
    save({ smsEnabled, vibration: updated, darkMode });
  };

  const toggleDarkMode = () => {
    const updated = !darkMode;
    setDarkMode(updated);
    save({ smsEnabled, vibration, darkMode: updated });
  };

  const clearContacts = async () => {
    await AsyncStorage.removeItem("contacts");
    Alert.alert("Cleared", "All contacts removed");
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🔴 HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.sub}>Manage your app preferences</Text>
      </View>

      {/* ⚙️ SETTINGS */}
      <View style={styles.card}>
        <Text style={styles.section}>General</Text>

        <View style={styles.row}>
          <Text style={styles.icon}>📩</Text>
          <View style={styles.textWrap}>
            <Text style={styles.label}>SMS Alerts</Text>
            <Text style={styles.subLabel}>Send SMS when no internet</Text>
          </View>
          <Switch value={smsEnabled} onValueChange={toggleSMS} />
        </View>

        <View style={styles.row}>
          <Text style={styles.icon}>📳</Text>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Vibration</Text>
            <Text style={styles.subLabel}>Vibrate on SOS trigger</Text>
          </View>
          <Switch value={vibration} onValueChange={toggleVibration} />
        </View>

        <View style={styles.row}>
          <Text style={styles.icon}>🌙</Text>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Dark Mode</Text>
            <Text style={styles.subLabel}>(UI only for now)</Text>
          </View>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>
      </View>

      {/* 🧹 ACTIONS */}
      <View style={styles.card}>
        <Text style={styles.section}>Danger Zone</Text>

        <TouchableOpacity style={styles.dangerBtn} onPress={clearContacts}>
          <Text style={styles.dangerText}>🧹 Clear All Contacts</Text>
        </TouchableOpacity>
      </View>

      {/* ℹ️ ABOUT */}
      <View style={styles.card}>
        <Text style={styles.section}>About</Text>
        <Text style={styles.about}>
          Emergency Alert App{"\n"}
          Version 1.0.0{"\n\n"}
          Built for safety and quick emergency response.
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  header: {
    backgroundColor: "#d32f2f",
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  sub: {
    color: "#fff",
    marginTop: 5,
    fontSize: 14,
  },

  card: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 20,
    padding: 15,
    elevation: 5,
  },

  section: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  icon: {
    fontSize: 18,
  },

  textWrap: {
    flex: 1,
    marginLeft: 10,
  },

  label: {
    fontSize: 16,
  },

  subLabel: {
    fontSize: 12,
    color: "#777",
  },

  dangerBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ffebee",
    alignItems: "center",
  },

  dangerText: {
    color: "#d32f2f",
    fontWeight: "bold",
  },

  about: {
    color: "#666",
    lineHeight: 20,
    fontSize: 13,
  },
});
