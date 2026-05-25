import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useTheme } from "../components/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topSection}>
        <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.circle}>
           <Ionicons name="shield-checkmark" size={80} color="#fff" />
        </LinearGradient>
      </View>

      <Animated.View entering={FadeInUp.delay(300)} style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Emergency Alert System</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>
          Your personal safety companion. Instant SOS alerts, live location sharing, and AI medical assistance.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600)} style={styles.bottomSection}>
        <TouchableOpacity 
          onPress={() => router.replace("/(tabs)")}
          style={[styles.primaryBtn, { backgroundColor: '#EF4444' }]}
        >
          <Text style={styles.primaryBtnText}>GET STARTED</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        
        <Text style={[styles.footerText, { color: colors.subText }]}>
          Protecting lives with tactical precision.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30 },
  topSection: { flex: 1.5, justifyContent: 'center', alignItems: 'center' },
  circle: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center', elevation: 20, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  content: { flex: 1, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 26, paddingHorizontal: 20, fontWeight: '600' },
  bottomSection: { flex: 1, justifyContent: 'flex-end', paddingBottom: 40, alignItems: 'center' },
  primaryBtn: { width: '100%', height: 65, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 8 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  footerText: { marginTop: 20, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
