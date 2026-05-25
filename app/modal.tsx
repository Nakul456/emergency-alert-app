import { Ionicons } from "@expo/vector-icons";
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useTheme } from "../components/ThemeContext";

export default function ModalScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={ZoomIn.duration(500)} style={[styles.iconCircle, { backgroundColor: colors.card }]}>
        <Ionicons name="information-circle" size={80} color={colors.primary} />
      </Animated.View>
      
      <Animated.Text entering={FadeInUp.delay(200)} style={[styles.title, { color: colors.text }]}>Welcome to SOS Alert</Animated.Text>
      
      <Animated.Text entering={FadeInUp.delay(300)} style={[styles.desc, { color: colors.subText }]}>
        This application is designed to save lives by providing instant access to emergency services and your trusted contacts.
      </Animated.Text>
      
      <Animated.View entering={FadeInUp.delay(400)} style={[styles.infoBox, { backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.text }]}>Real-time GPS Tracking</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.text }]}>Instant SMS Alerts</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.text }]}>First-Aid AI Assistant</Text>
        </View>
      </Animated.View>

      <Link href="/" dismissTo asChild>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={styles.buttonText}>Got it!</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: -1,
  },
  desc: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 20,
    fontWeight: "500",
  },
  infoBox: {
    width: '100%',
    borderRadius: 32,
    padding: 24,
    marginBottom: 50,
    gap: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    paddingHorizontal: 70,
    paddingVertical: 22,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
  },
});
