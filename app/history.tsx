import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Linking, Alert } from "react-native";
import { useTheme } from "../components/ThemeContext";
import { getDatabase, ref, onValue } from "firebase/database";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const db = getDatabase();
    const logsRef = ref(db, 'emergency_logs');
    return onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
        setLogs(list);
      }
    });
  }, []);

  const openLocationMap = (lat: number, lng: number) => {
    if (!lat || !lng) {
      Alert.alert("No Location Data", "No coordinates are recorded for this log entry.");
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Failed to launch native maps application.");
    });
  };

  const renderLog = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.logContainer}>
       <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statusIndicator, { backgroundColor: item.status === 'Resolved' ? '#10B981' : '#EF4444' }]} />
          <View style={styles.logContent}>
             <View style={styles.logTop}>
                <Text style={[styles.logType, { color: colors.text }]}>{item.type || "Emergency SOS"}</Text>
                <Text style={[styles.logTime, { color: colors.subText }]}>{item.timestamp || "Just Now"}</Text>
             </View>
             <View style={styles.locRow}>
                <Ionicons name="location" size={14} color="#EF4444" />
                <Text style={[styles.locText, { color: colors.subText }]}>{item.location || "Location Shared"}</Text>
             </View>
             <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                   <Text style={styles.badgeText}>{item.status || "Alerted"}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.detailBtn}
                  onPress={() => openLocationMap(item.latitude, item.longitude)}
                >
                   <Text style={styles.detailBtnText}>VIEW MAP</Text>
                   <Ionicons name="chevron-forward" size={12} color="#EF4444" />
                </TouchableOpacity>
             </View>
          </View>
       </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
           <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>MISSION LOGS</Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={renderLog}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
           <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: colors.text }]}>Emergency History</Text>
              <Text style={[styles.listSub, { color: colors.subText }]}>Chronological record of all emergency triggers and system alerts.</Text>
           </View>
        )}
        ListEmptyComponent={() => (
           <View style={styles.center}>
              <Ionicons name="document-text-outline" size={60} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>No logs found.</Text>
           </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "900", letterSpacing: 2, marginLeft: 15 },
  listContent: { padding: 24, paddingBottom: 100 },
  listHeader: { marginBottom: 30 },
  listTitle: { fontSize: 26, fontWeight: "900" },
  listSub: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  logContainer: { marginBottom: 15 },
  logCard: { flexDirection: "row", borderRadius: 30, borderWidth: 1, overflow: "hidden" },
  statusIndicator: { width: 6 },
  logContent: { flex: 1, padding: 20 },
  logTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  logType: { fontSize: 18, fontWeight: "800" },
  logTime: { fontSize: 12, fontWeight: "600" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 15 },
  locText: { fontSize: 13, fontWeight: "600" },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: "#EF4444", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  detailBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailBtnText: { color: "#EF4444", fontSize: 12, fontWeight: "800" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16, fontWeight: "700" },
});
