import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

export default function HistoryScreen() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const emergencyRef = ref(db, "emergencies");

    const unsubscribe = onValue(emergencyRef, (snapshot) => {
      const val = snapshot.val();

      if (val) {
        const list = Object.keys(val).map((key) => ({
          id: key,
          ...val[key],
        }));

        setData(list.reverse());
      } else {
        setData([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Alert History</Text>

      {data.length === 0 ? (
        <Text style={styles.empty}>No alerts found 🚫</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text>📍 Lat: {item.latitude}</Text>
              <Text>📍 Lng: {item.longitude}</Text>
              <Text>⏰ {new Date(item.time).toLocaleString()}</Text>

              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${item.latitude},${item.longitude}`,
                  )
                }
              >
                <Text style={{ color: "blue", marginTop: 10 }}>
                  📍 Open in Maps
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  empty: { textAlign: "center", marginTop: 50 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 12,
    borderRadius: 15,
    elevation: 5,
  },
});
