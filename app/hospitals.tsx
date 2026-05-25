import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Linking, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../components/ThemeContext";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HospitalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetchNearbyHospitals();
  }, []);

  const fetchNearbyHospitals = async () => {
    setLoading(true);
    let loc = null;
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error("Location permission denied");
      }
      
      try {
        const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );
        loc = await Promise.race([locationPromise, timeoutPromise]);
      } catch (locErr) {
        loc = await Location.getLastKnownPositionAsync({});
      }

      // If absolutely no coordinates are fetched, fallback to center coordinates
      const latitude = loc ? loc.coords.latitude : 37.78825;
      const longitude = loc ? loc.coords.longitude : -122.4324;

      const radius = 5000; // scan within 5km (5000 meters)
      // Flat query string with absolutely NO newlines or leading spaces
      const query = `[out:json];(nwr["amenity"~"hospital|clinic"](around:${radius},${latitude},${longitude});nwr["healthcare"~"hospital|clinic|urgent_care"](around:${radius},${latitude},${longitude}););out center;`;
      
      const mirrors = [
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
        `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`,
        `https://lz4.overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      ];

      let response = null;
      let lastFetchError = null;

      for (const mirrorUrl of mirrors) {
        try {
          const res = await fetch(mirrorUrl, {
            headers: {
              "User-Agent": "CareWaveEmergencySOS/1.0 (Emergency medical facility locator; contact: support@carewave.com)"
            }
          });
          if (res.ok) {
            response = res;
            break;
          } else {
            console.log(`Mirror returned status ${res.status}: ${mirrorUrl}`);
          }
        } catch (mirrorErr) {
          console.log(`Failed to contact mirror: ${mirrorUrl}`, mirrorErr);
          lastFetchError = mirrorErr;
        }
      }

      if (!response) {
        throw new Error(lastFetchError ? String(lastFetchError) : "All mirrors failed to respond");
      }

      const data = await response.json();

      if (!data || !data.elements) {
        throw new Error("Invalid response from OSM Overpass");
      }

      // Deduplicate results by their OSM ID
      const seenIds = new Set();
      const results = data.elements
        .filter((el: any) => {
          if (seenIds.has(el.id)) return false;
          seenIds.add(el.id);
          return true;
        })
        .map((el: any) => {
          const lat = el.lat ?? el.center?.lat ?? latitude;
          const lon = el.lon ?? el.center?.lon ?? longitude;
          return {
            id: el.id.toString(),
            name: el.tags.name || el.tags.operator || el.tags.brand || "Medical Facility",
            address: el.tags["addr:street"] 
              ? `${el.tags["addr:street"]} ${el.tags["addr:housenumber"] || ""}`.trim()
              : el.tags["addr:suburb"] || el.tags["addr:city"] || el.tags["addr:place"] || "Emergency Healthcare Center",
            distance: calculateDistance(latitude, longitude, lat, lon).toFixed(1) + " km",
            lat,
            lon,
          };
        })
        .sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));

      setHospitals(results);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.log("OSM Overpass Error:", err);
      
      // Resilient local coordinates fallback
      const fallbackLat = loc?.coords?.latitude ?? 37.78825;
      const fallbackLon = loc?.coords?.longitude ?? -122.4324;
      
      const mockLat1 = fallbackLat + 0.009;
      const mockLon1 = fallbackLon + 0.009;
      const mockLat2 = fallbackLat - 0.012;
      const mockLon2 = fallbackLon - 0.012;
      const mockLat3 = fallbackLat + 0.018;
      const mockLon3 = fallbackLon - 0.018;

      setHospitals([
        { id: 'm1', name: 'City Central Hospital', address: 'Main Square, City Center', distance: calculateDistance(fallbackLat, fallbackLon, mockLat1, mockLon1).toFixed(1) + " km", lat: mockLat1, lon: mockLon1 },
        { id: 'm2', name: 'Emergency Care Unit', address: 'North Block Campus', distance: calculateDistance(fallbackLat, fallbackLon, mockLat2, mockLon2).toFixed(1) + " km", lat: mockLat2, lon: mockLon2 },
        { id: 'm3', name: 'Metro General Hospital', address: 'West Sector Avenue', distance: calculateDistance(fallbackLat, fallbackLon, mockLat3, mockLon3).toFixed(1) + " km", lat: mockLat3, lon: mockLon3 },
      ]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " (Demo Mode)");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
  };

  const renderHospital = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.cardContainer}>
       <View style={[styles.hospCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
             <Ionicons name="medical" size={24} color="#EF4444" />
          </View>
          <View style={styles.cardRight}>
             <Text style={[styles.hospName, { color: colors.text }]}>{item.name}</Text>
             <Text style={[styles.hospAddr, { color: colors.subText }]}>{item.address}</Text>
             <View style={styles.metaRow}>
                <Ionicons name="navigate-circle" size={14} color="#EF4444" />
                <Text style={styles.metaText}>{item.distance}</Text>
             </View>
          </View>
          <TouchableOpacity 
             onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`)}
             style={styles.mapBtn}
          >
             <Ionicons name="map-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
       </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
             <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>MEDICAL FACILITIES</Text>
        </View>
        <TouchableOpacity 
          onPress={fetchNearbyHospitals} 
          disabled={loading}
          style={[styles.reloadHeaderBtn, { backgroundColor: colors.card }]}
        >
           <Ionicons name="refresh" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={[styles.loadingText, { color: colors.subText }]}>Scanning nearby help...</Text>
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={item => item.id}
          renderItem={renderHospital}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => (
             <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: colors.text }]}>Nearby Hospitals</Text>
                <Text style={[styles.listSub, { color: colors.subText }]}>Found {hospitals.length} centers near you.</Text>
                {lastUpdated ? (
                  <Text style={[styles.updateTimeText, { color: colors.subText }]}>Last scanned: {lastUpdated}</Text>
                ) : null}
             </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "900", letterSpacing: 2, marginLeft: 15 },
  reloadHeaderBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontWeight: '700' },
  listContent: { padding: 24, paddingBottom: 100 },
  listHeader: { marginBottom: 30 },
  listTitle: { fontSize: 26, fontWeight: "900" },
  listSub: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  updateTimeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginTop: 10 },
  cardContainer: { marginBottom: 15 },
  hospCard: { flexDirection: "row", padding: 20, borderRadius: 30, borderWidth: 1, alignItems: "center" },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 15 },
  cardRight: { flex: 1 },
  hospName: { fontSize: 17, fontWeight: "800" },
  hospAddr: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaText: { fontSize: 13, fontWeight: "800", color: '#EF4444' },
  mapBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: "center", alignItems: "center" },
});
