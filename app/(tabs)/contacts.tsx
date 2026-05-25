import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View, FlatList, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "../../components/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ContactsScreen() {
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem("contacts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setContacts(parsed);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const addContact = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert("Error", "Please enter both name and phone number.");
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    await AsyncStorage.setItem("contacts", JSON.stringify(updated));
    
    setNewName("");
    setNewPhone("");
    setShowAddModal(false);
    Alert.alert("Success", "Contact added to your emergency network.");
  };

  const deleteContact = (id: string) => {
    Alert.alert("Delete Contact", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const filtered = contacts.filter(c => c.id !== id);
        setContacts(filtered);
        await AsyncStorage.setItem("contacts", JSON.stringify(filtered));
      }}
    ]);
  };

  const renderContact = ({ item, index }: { item: any, index: number }) => {
    if (!item) return null;
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.cardContainer}>
         <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatarBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
               <Text style={styles.avatarText}>{item.name?.charAt(0) || "?"}</Text>
            </View>
            <View style={styles.cardInfo}>
               <Text style={[styles.contactName, { color: colors.text }]}>{item.name || "Unknown"}</Text>
               <Text style={[styles.contactPhone, { color: colors.subText }]}>{item.phone || "No Number"}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteContact(item.id)} style={styles.deleteBtn}>
               <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
         </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>EMERGENCY NETWORK</Text>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          style={[styles.addBtn, { backgroundColor: '#EF4444' }]}
        >
           <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        renderItem={renderContact}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
           <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: colors.text }]}>Saved Contacts</Text>
              <Text style={[styles.listSub, { color: colors.subText }]}>These people will be alerted instantly when you trigger SOS.</Text>
           </View>
        )}
        ListEmptyComponent={() => (
           <View style={styles.center}>
              <Ionicons name="people-outline" size={60} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>No contacts saved yet.</Text>
           </View>
        )}
      />

      {/* ADD CONTACT MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
           <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: colors.text }]}>Add Contact</Text>
                 <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                 </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                 <Text style={[styles.inputLabel, { color: colors.subText }]}>NAME</Text>
                 <TextInput 
                   style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                   placeholder="John Doe"
                   placeholderTextColor={colors.subText}
                   value={newName}
                   onChangeText={setNewName}
                 />
              </View>

              <View style={styles.inputGroup}>
                 <Text style={[styles.inputLabel, { color: colors.subText }]}>PHONE NUMBER</Text>
                 <TextInput 
                   style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                   placeholder="+91 98765 43210"
                   placeholderTextColor={colors.subText}
                   keyboardType="phone-pad"
                   value={newPhone}
                   onChangeText={setNewPhone}
                 />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={addContact}>
                 <Text style={styles.saveBtnText}>SAVE CONTACT</Text>
              </TouchableOpacity>
           </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", elevation: 4 },
  listContent: { padding: 24, paddingBottom: 100 },
  listHeader: { marginBottom: 30 },
  listTitle: { fontSize: 26, fontWeight: "900" },
  listSub: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  cardContainer: { marginBottom: 15 },
  contactCard: { flexDirection: "row", padding: 20, borderRadius: 30, borderWidth: 1, alignItems: "center" },
  avatarBox: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 15 },
  avatarText: { color: "#EF4444", fontSize: 20, fontWeight: "800" },
  cardInfo: { flex: 1 },
  contactName: { fontSize: 17, fontWeight: "800" },
  contactPhone: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  deleteBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: "center", alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16, fontWeight: "700" },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 35, padding: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  inputGroup: { marginBottom: 25 },
  inputLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  input: { height: 60, borderRadius: 18, borderWidth: 1, paddingHorizontal: 20, fontSize: 16, fontWeight: '700' },
  saveBtn: { height: 65, borderRadius: 20, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
