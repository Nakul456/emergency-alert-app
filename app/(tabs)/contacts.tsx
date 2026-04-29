import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const loadContacts = async () => {
      const saved = await AsyncStorage.getItem("contacts");
      if (saved) setContacts(JSON.parse(saved));
    };
    loadContacts();
  }, []);

  const addContact = async () => {
    if (input.length < 10) {
      alert("Enter valid number");
      return;
    }

    let formatted = input.startsWith("+91") ? input : "+91" + input;

    const updated = [...new Set([...contacts, formatted])];

    setContacts(updated);
    setInput("");

    await AsyncStorage.setItem("contacts", JSON.stringify(updated));
  };

  const removeContact = async (number: string) => {
    const updated = contacts.filter((c) => c !== number);
    setContacts(updated);

    await AsyncStorage.setItem("contacts", JSON.stringify(updated));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter phone number (+91...)"
        placeholderTextColor="#aaa" // 👈 visible placeholder
        keyboardType="phone-pad"
        value={input}
        onChangeText={setInput}
      />

      <TouchableOpacity style={styles.addBtn} onPress={addContact}>
        <Text style={{ color: "#fff" }}>Add Contact</Text>
      </TouchableOpacity>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item}</Text>

            <TouchableOpacity onPress={() => removeContact(item)}>
              <Text style={{ color: "red" }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    color: "#fff", // 👈 TEXT COLOR (IMPORTANT)
    backgroundColor: "#111", // 👈 DARK BG so text visible
  },
  addBtn: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
