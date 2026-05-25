import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Linking } from "react-native";
import { useTheme } from "../components/ThemeContext";

export default function LocationScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          router.back();
          return;
        }

        let loc;
        try {
          const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 5000)
          );
          loc = await Promise.race([locationPromise, timeoutPromise]);
        } catch (e) {
          loc = await Location.getLastKnownPositionAsync({});
        }

        // Use real coordinates if available, fallback to India center coordinates if none
        const lat = loc ? loc.coords.latitude : 19.0760;
        const lon = loc ? loc.coords.longitude : 72.8777;
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        
        await Linking.openURL(url);
        router.back();
      } catch (err) {
        console.log("Error opening maps", err);
        router.back();
      }
    })();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color="#EF4444" />
      <Text style={[styles.text, { color: colors.text }]}>Redirecting to Maps...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 15 },
  text: { fontSize: 16, fontWeight: "700" }
});
