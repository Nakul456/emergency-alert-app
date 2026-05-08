import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { onValue, ref, remove } from "firebase/database";
import { db } from "../firebaseConfig";

export default function HistoryScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🗺 Open in maps
  const openMap = (lat: number, lng: number) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  // 🗑 Delete single item
  const deleteItem = (id: string) => {
    Alert.alert("Delete Alert?", "This will remove this history permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(ref(db, "emergencies/" + id));
          } catch (err) {
            console.log(err);
            Alert.alert("Error deleting");
          }
        },
      },
    ]);
  };

  // 🧹 Clear all
  const clearAll = () => {
    Alert.alert("Clear All?", "This will delete all history permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(ref(db, "emergencies"));
          } catch (err) {
            console.log(err);
            Alert.alert("Error clearing history");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: any) => {
    const formattedTime = item.time
      ? new Date(item.time).toLocaleString()
      : "Unknown time";

    return (
      <View style={styles.card}>
        <Text style={styles.title}>🚨 Emergency Alert</Text>

        <View style={styles.divider} />

        <Text style={styles.text}>
          📍 {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
        </Text>

        <Text style={styles.time}>🕐 {formattedTime}</Text>

        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => openMap(item.latitude, item.longitude)}
        >
          <Text style={styles.mapText}>Open in Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteItem(item.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 🔄 Loading
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d32f2f" />
        <Text style={{ marginTop: 10 }}>Loading history...</Text>
      </View>
    );
  }

  // 🚫 Empty
  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No Alerts Yet 🚫</Text>
        <Text style={styles.emptySub}>
          Your emergency history will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 🧹 Clear all button */}
      <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
        <Text style={styles.clearText}>Clear All History</Text>
      </TouchableOpacity>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 15,
    elevation: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d32f2f",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },

  text: {
    fontSize: 14,
    marginBottom: 6,
  },

  time: {
    fontSize: 13,
    color: "#555",
    marginBottom: 12,
  },

  mapBtn: {
    backgroundColor: "#d32f2f",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  mapText: {
    color: "#fff",
    fontWeight: "bold",
  },

  deleteBtn: {
    marginTop: 10,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteText: {
    color: "red",
    fontWeight: "bold",
  },

  clearBtn: {
    backgroundColor: "#000",
    padding: 12,
    margin: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  clearText: {
    color: "#fff",
    fontWeight: "bold",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  emptySub: {
    color: "#777",
  },
});
