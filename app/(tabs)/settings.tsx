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
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "../../components/ThemeContext";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAccidentDetection } from "../../components/AccidentDetectionContext";

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, currentTheme, setTheme, colors } = useTheme();
  const router = useRouter();
  const { isDetectionEnabled, setDetectionEnabled } = useAccidentDetection();
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [sirenEnabled, setSirenEnabled] = useState(true);
  const [countdownDuration, setCountdownDuration] = useState(5);
  const [voiceSosEnabled, setVoiceSosEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await AsyncStorage.getItem("settings");
      if (data) {
        const s = JSON.parse(data);
        setSmsEnabled(s.smsEnabled ?? true);
        setVibration(s.vibration ?? true);
        setSirenEnabled(s.sirenEnabled ?? true);
        setCountdownDuration(s.countdownDuration ?? 5);
        setVoiceSosEnabled(s.voiceSosEnabled ?? false);
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
    save({ smsEnabled: updated, vibration, sirenEnabled, countdownDuration, voiceSosEnabled });
    if (vibration) {
      Vibration.vibrate(60);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleVibration = () => {
    const updated = !vibration;
    setVibration(updated);
    save({ smsEnabled, vibration: updated, sirenEnabled, countdownDuration, voiceSosEnabled });
    if (updated) {
      Vibration.vibrate(80);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleSirenSetting = () => {
    const updated = !sirenEnabled;
    setSirenEnabled(updated);
    save({ smsEnabled, vibration, sirenEnabled: updated, countdownDuration, voiceSosEnabled });
    if (vibration) {
      Vibration.vibrate(60);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleVoiceSosSetting = () => {
    const updated = !voiceSosEnabled;
    setVoiceSosEnabled(updated);
    save({ smsEnabled, vibration, sirenEnabled, countdownDuration, voiceSosEnabled: updated });
    if (vibration) {
      Vibration.vibrate(60);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleToggleDetection = (value: boolean) => {
    setDetectionEnabled(value);
    if (vibration) {
      Vibration.vibrate(60);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const updateCountdownDuration = (duration: number) => {
    setCountdownDuration(duration);
    save({ smsEnabled, vibration, sirenEnabled, countdownDuration: duration, voiceSosEnabled });
    if (vibration) {
      Vibration.vibrate(100);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const clearContacts = async () => {
    Alert.alert("Clear Contacts?", "This will remove all your emergency contacts permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("contacts");
          Alert.alert("Success", "Emergency contacts cleared.");
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You will need to log in again.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear(); 
            router.replace("/login");
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.sub}>Configure your emergency preferences</Text>
      </View>

      <View style={styles.content}>
        {/* PREFERENCES */}
        <Animated.View entering={FadeInUp.delay(200)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>App Preferences</Text>

          <View style={styles.settingRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="mail" size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text }]}>SMS Alerts</Text>
              <Text style={[styles.subLabel, { color: colors.subText }]}>Auto-send SMS when SOS is triggered</Text>
            </View>
            <Switch 
              value={smsEnabled} 
              onValueChange={toggleSMS}
              trackColor={{ false: "#D5D8DC", true: "#FFD0D0" }}
              thumbColor={smsEnabled ? colors.primary : "#F4F6F8"}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="pulse" size={22} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Vibration</Text>
              <Text style={[styles.subLabel, { color: colors.subText }]}>Vibrate phone during SOS countdown</Text>
            </View>
            <Switch 
              value={vibration} 
              onValueChange={toggleVibration}
              trackColor={{ false: "#D5D8DC", true: "#FFD0D0" }}
              thumbColor={vibration ? colors.primary : "#F4F6F8"}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Crash & Fall Guard</Text>
              <Text style={[styles.subLabel, { color: colors.subText }]}>AI edge inertia accident detection</Text>
            </View>
            <Switch 
              value={isDetectionEnabled} 
              onValueChange={handleToggleDetection}
              trackColor={{ false: "#D5D8DC", true: "#FFD0D0" }}
              thumbColor={isDetectionEnabled ? colors.primary : "#F4F6F8"}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="volume-high" size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Emergency Siren</Text>
              <Text style={[styles.subLabel, { color: colors.subText }]}>Play sound during accident detection alerts</Text>
            </View>
            <Switch 
              value={sirenEnabled} 
              onValueChange={toggleSirenSetting}
              trackColor={{ false: "#D5D8DC", true: "#FFD0D0" }}
              thumbColor={sirenEnabled ? colors.primary : "#F4F6F8"}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="mic" size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Voice SOS Activation</Text>
              <Text style={[styles.subLabel, { color: colors.subText }]}>Trigger SOS hands-free by saying {"\"Help Help\""}</Text>
            </View>
            <Switch 
              value={voiceSosEnabled} 
              onValueChange={toggleVoiceSosSetting}
              trackColor={{ false: "#D5D8DC", true: "#FFD0D0" }}
              thumbColor={voiceSosEnabled ? colors.primary : "#F4F6F8"}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text }]}>SOS Countdown</Text>
              <Text style={[styles.subLabel, { color: colors.subText }]}>Delay duration before alert is dispatched</Text>
            </View>
          </View>

          <View style={styles.pickerRow}>
            {[3, 5, 10].map((duration) => (
              <TouchableOpacity
                key={duration}
                onPress={() => updateCountdownDuration(duration)}
                style={[
                  styles.pickerBtn,
                  { borderColor: colors.border },
                  countdownDuration === duration && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                <Text style={[
                  styles.pickerBtnText,
                  { color: colors.text },
                  countdownDuration === duration && { color: '#fff' }
                ]}>
                  {duration} Seconds
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="color-palette" size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Theme Customization</Text>
              <Text style={[styles.subLabel, { color: colors.subText }]}>Select a premium visual style</Text>
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.themeScrollContainer}
          >
            {[
              { id: "red", label: "Red Emergency", color: "#EF4444" },
              { id: "blue", label: "Blue Medical", color: "#00B4D8" },
              { id: "cyber", label: "Neon Cyber", color: "#00F5D4" },
              { id: "amoled", label: "AMOLED Black", color: "#27272A" },
              { id: "white", label: "White Medical", color: "#EF4444" }
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  setTheme(t.id as any);
                  if (vibration) {
                    Vibration.vibrate(80);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  }
                }}
                style={[
                  styles.themeChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  currentTheme === t.id && { borderColor: t.id === "amoled" ? "#64748B" : t.color, borderWidth: 2 }
                ]}
              >
                <View style={[styles.themeColorDot, { backgroundColor: t.id === "amoled" ? "#64748B" : t.color }]} />
                <Text style={[
                  styles.themeChipText,
                  { color: colors.text },
                  currentTheme === t.id && { fontWeight: "900" }
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* DANGER ZONE */}
        <Animated.View entering={FadeInUp.delay(300)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Danger Zone</Text>
          
          <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: colors.accent, borderColor: colors.border }]} onPress={clearContacts}>
            <Ionicons name="trash-bin-outline" size={20} color={colors.primary} />
            <Text style={styles.dangerText}>Clear All Emergency Contacts</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ABOUT */}
        <Animated.View entering={FadeInUp.delay(400)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>About Application</Text>
          <View style={[styles.aboutBox, { backgroundColor: colors.background }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.subText }]}>Version</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0 (Stable)</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.subText }]}>Developer</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>Emergency Response Team</Text>
            </View>
          </View>
          <Text style={[styles.aboutText, { color: colors.subText }]}>
            Built with ❤️ to ensure safety and provide instant assistance in critical medical or personal emergencies.
          </Text>
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
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  sub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
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
    borderColor: 'rgba(0,0,0,0.03)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 20,
    opacity: 0.6,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  textContainer: { flex: 1, marginLeft: 18 },
  label: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  subLabel: { fontSize: 13, fontWeight: "600", marginTop: 4, opacity: 0.6 },
  divider: { height: 1.5, marginVertical: 4 },
  dangerBtn: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1.5,
  },
  dangerText: { fontWeight: "900", fontSize: 16, letterSpacing: -0.2 },
  aboutBox: { padding: 20, borderRadius: 24, marginBottom: 20 },
  aboutRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  aboutLabel: { fontWeight: "700", fontSize: 14, opacity: 0.6 },
  aboutValue: { fontWeight: "800", fontSize: 14 },
  aboutText: { fontSize: 13, textAlign: "center", lineHeight: 20, fontWeight: "600", opacity: 0.5 },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  pickerBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  themeScrollContainer: {
    paddingVertical: 10,
    gap: 12,
  },
  themeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 8,
  },
  themeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
