import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput, Alert, Modal, Image, Switch, Vibration } from "react-native";
import { useTheme } from "../../components/ThemeContext";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const triggerHaptic = (style: "light" | "medium" | "heavy" | "success" | "warning" = "light") => {
    if (!vibrationEnabled) return;
    Vibration.vibrate(style === "success" || style === "warning" ? 150 : 60);
    if (style === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (style === "warning") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (style === "heavy") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (style === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Profile data states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bloodType, setBloodType] = useState("Not Set");
  const [allergies, setAllergies] = useState("Not Set");
  const [isEditing, setIsEditing] = useState(false);
  const [showBloodModal, setShowBloodModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [allergySearch, setAllergySearch] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Advanced Modals visibility
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrString, setQrString] = useState("");

  // Medical History states
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [medsList, setMedsList] = useState<string[]>([]);
  const [newMedText, setNewMedText] = useState("");
  const [organDonor, setOrganDonor] = useState(false);

  // Insurance details states
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [tpaPhone, setTpaPhone] = useState("");

  // Privacy details states
  const [locationSharing, setLocationSharing] = useState<"always" | "sos">("always");
  const [shareDiagnostics, setShareDiagnostics] = useState(true);

  const generateQRData = async () => {
    // Load emergency contacts
    let contactsList = [];
    try {
      const storedContacts = await AsyncStorage.getItem("contacts");
      if (storedContacts) {
        contactsList = JSON.parse(storedContacts);
      }
    } catch (e) {
      console.log("Error loading contacts for QR code:", e);
    }

    const contactStr = contactsList
      .map((c: any, index: number) => {
        const cName = c.name || "Contact";
        const cPhone = c.phone || c;
        return `${index + 1}. ${cName}: ${cPhone}`;
      })
      .join("\n");

    const text = `--- EMERGENCY MEDICAL CARD ---\n` +
      `Name: ${name || "Not Set"}\n` +
      `Blood Group: ${bloodType}\n` +
      `Allergies: ${allergies}\n` +
      `Conditions: ${chronicConditions.join(", ") || "None"}\n` +
      `Meds: ${medsList.join(", ") || "None"}\n` +
      `Insurance: ${insuranceProvider || "None"} (${policyNumber || "N/A"})\n` +
      `Emergency Contacts:\n${contactStr || "None"}\n` +
      `------------------------------`;

    setQrString(text);
    setShowQRModal(true);
    triggerHaptic("medium");
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not Set"];

  const commonAllergies = [
    "No Known Allergies (NKDA)",
    "Penicillin",
    "Sulfa Drugs",
    "Aspirin",
    "NSAIDs (Ibuprofen)",
    "Peanuts",
    "Tree Nuts",
    "Shellfish",
    "Milk / Dairy",
    "Eggs",
    "Soy",
    "Wheat / Gluten",
    "Latex",
    "Bee Stings",
    "Pollen / Hay Fever",
    "Not Set"
  ];

  const filteredAllergies = commonAllergies.filter(item =>
    item.toLowerCase().includes(allergySearch.toLowerCase())
  );

  const showCustomAllergyOption = allergySearch.trim().length > 0 && 
    !commonAllergies.some(item => item.toLowerCase() === allergySearch.trim().toLowerCase());

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem("user_profile");
        if (stored) {
          const data = JSON.parse(stored);
          const loadedName = data.name || "";
          const loadedEmail = data.email || "";

          // Clean legacy mockup data saved on device database
          setName((loadedName === "User Name" || loadedName === "User name" || !loadedName) ? "" : loadedName);
          setEmail((loadedEmail === "user@example.com" || !loadedEmail) ? "" : loadedEmail);
          
          setBloodType(data.bloodType || "Not Set");
          setAllergies(data.allergies || "Not Set");
        }

        const storedPhoto = await AsyncStorage.getItem("user_profile_photo");
        if (storedPhoto) {
          setProfilePhoto(storedPhoto);
        }

        const storedMedical = await AsyncStorage.getItem("user_medical_history");
        if (storedMedical) {
          const medData = JSON.parse(storedMedical);
          setChronicConditions(medData.conditions || []);
          setMedsList(medData.medications || []);
          setOrganDonor(!!medData.organDonor);
        }

        const storedInsurance = await AsyncStorage.getItem("user_insurance");
        if (storedInsurance) {
          const insData = JSON.parse(storedInsurance);
          setInsuranceProvider(insData.provider || "");
          setPolicyNumber(insData.policyNumber || "");
          setTpaPhone(insData.tpaPhone || "");
        }

        const storedPrivacy = await AsyncStorage.getItem("user_privacy");
        if (storedPrivacy) {
          const privData = JSON.parse(storedPrivacy);
          setLocationSharing(privData.locationSharing || "always");
          setShareDiagnostics(privData.shareDiagnostics !== false);
        }
        const storedSettings = await AsyncStorage.getItem("settings");
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          setVibrationEnabled(parsed.vibration ?? true);
        }
      } catch (err) {
        console.log("Error loading profile:", err);
      }
    };
    loadProfile();
  }, []);

  const saveMedicalHistory = async () => {
    try {
      await AsyncStorage.setItem(
        "user_medical_history",
        JSON.stringify({ conditions: chronicConditions, medications: medsList, organDonor })
      );
      setShowMedicalModal(false);
      triggerHaptic("success");
      Alert.alert("Success", "Medical history updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to save medical history.");
    }
  };

  const saveInsurance = async () => {
    try {
      await AsyncStorage.setItem(
        "user_insurance",
        JSON.stringify({ provider: insuranceProvider, policyNumber, tpaPhone })
      );
      setShowInsuranceModal(false);
      triggerHaptic("success");
      Alert.alert("Success", "Insurance details updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to save insurance details.");
    }
  };

  const savePrivacy = async () => {
    try {
      await AsyncStorage.setItem(
        "user_privacy",
        JSON.stringify({ locationSharing, shareDiagnostics })
      );
      setShowPrivacyModal(false);
      triggerHaptic("success");
      Alert.alert("Success", "Privacy settings updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to save privacy settings.");
    }
  };

  const purgeAllData = () => {
    Alert.alert(
      "Confirm Data Wiping",
      "This will wipe all profile photos, names, insurance details, medical conditions, and settings permanently. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Wipe All Data", 
          style: "destructive", 
          onPress: async () => {
            triggerHaptic("warning");
            await AsyncStorage.clear();
            setName("");
            setEmail("");
            setBloodType("Not Set");
            setAllergies("Not Set");
            setProfilePhoto(null);
            setChronicConditions([]);
            setMedsList([]);
            setNewMedText("");
            setOrganDonor(false);
            setInsuranceProvider("");
            setPolicyNumber("");
            setTpaPhone("");
            setLocationSharing("always");
            setShareDiagnostics(true);
            setShowPrivacyModal(false);
            Alert.alert("Success", "All local application data has been wiped.");
          }
        }
      ]
    );
  };

  const startEditing = () => {
    // Sanitize state values when entering edit mode
    if (name === "User Name" || name === "User name") {
      setName("");
    }
    if (email === "user@example.com") {
      setEmail("");
    }
    triggerHaptic("medium");
    setIsEditing(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "We need access to your photos to update your profile picture.");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setProfilePhoto(selectedUri);
        await AsyncStorage.setItem("user_profile_photo", selectedUri);
        triggerHaptic("success");
        Alert.alert("Success", "Profile photo updated!");
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const removePhoto = async () => {
    setProfilePhoto(null);
    await AsyncStorage.removeItem("user_profile_photo");
    triggerHaptic("success");
    Alert.alert("Success", "Profile photo removed.");
  };

  const handlePhotoPress = () => {
    Alert.alert(
      "Profile Photo",
      "Update your profile picture",
      [
        { text: "Choose from Library", onPress: pickImage },
        profilePhoto ? { text: "Remove Photo", style: "destructive", onPress: removePhoto } : null,
        { text: "Cancel", style: "cancel" }
      ].filter(Boolean) as any
    );
  };

  // Save profile details
  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem(
        "user_profile",
        JSON.stringify({ name, email, bloodType, allergies })
      );
      setIsEditing(false);
      triggerHaptic("success");
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
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

  const handleActionPress = (item: any) => {
    triggerHaptic("medium");
    if (item.id === '1') {
      setShowMedicalModal(true);
    } else if (item.id === '2') {
      setShowInsuranceModal(true);
    } else if (item.id === '4') {
      setShowPrivacyModal(true);
    } else if (item.route) {
      router.push(item.route);
    } else {
      Alert.alert(item.label, `Configuration for ${item.label} is active.`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* PROFILE HEADER */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.profileHeader}>
           <TouchableOpacity 
             activeOpacity={0.8}
             onPress={handlePhotoPress}
             style={[styles.avatarContainer, { borderColor: '#EF4444' }]}
           >
              <View style={[styles.avatar, { backgroundColor: colors.card, overflow: "hidden" }]}>
                 {profilePhoto ? (
                   <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                 ) : (
                   <Ionicons name="person" size={50} color="#EF4444" />
                 )}
              </View>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handlePhotoPress}
                style={[styles.editBtn, { backgroundColor: '#EF4444', borderColor: colors.background }]}
              >
                 <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
           </TouchableOpacity>

           {isEditing ? (
             <View style={styles.editInputContainer}>
               <View style={styles.inputWrapper}>
                 <TextInput
                   style={[styles.inputName, { color: colors.text, borderColor: colors.border, backgroundColor: colors.accent }]}
                   value={name}
                   onChangeText={setName}
                   placeholder="User Name"
                   placeholderTextColor={colors.subText}
                 />
                 {name.length > 0 && (
                   <TouchableOpacity onPress={() => setName("")} style={styles.clearInputIcon}>
                     <Ionicons name="close-circle" size={18} color={colors.subText} />
                   </TouchableOpacity>
                 )}
               </View>
               <View style={styles.inputWrapper}>
                 <TextInput
                   style={[styles.inputEmail, { color: colors.subText, borderColor: colors.border, backgroundColor: colors.accent }]}
                   value={email}
                   onChangeText={setEmail}
                   placeholder="user@example.com"
                   placeholderTextColor={colors.subText}
                   keyboardType="email-address"
                 />
                 {email.length > 0 && (
                   <TouchableOpacity onPress={() => setEmail("")} style={styles.clearInputIcon}>
                     <Ionicons name="close-circle" size={18} color={colors.subText} />
                   </TouchableOpacity>
                 )}
               </View>
             </View>
           ) : (
             <>
               <Text style={[styles.userName, { color: colors.text }]}>{name || "User Name"}</Text>
               <View style={[styles.verifiedBadge, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                 <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                 <Text style={styles.verifiedBadgeText}>Verified Profile</Text>
               </View>
               <Text style={[styles.userEmail, { color: colors.subText }]}>{email || "user@example.com"}</Text>
             </>
           )}
        </Animated.View>

        {/* MEDICAL SUMMARY CARDS */}
        <View style={styles.grid}>
           <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="water" size={24} color="#EF4444" />
              <Text style={[styles.cardLabel, { color: colors.subText }]}>BLOOD TYPE</Text>
              {isEditing ? (
                <TouchableOpacity 
                  onPress={() => setShowBloodModal(true)}
                  style={[styles.cardSelectorBtn, { borderColor: colors.border, backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.cardSelectorBtnText, { color: colors.text }]}>{bloodType}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.subText} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cardVal, { color: colors.text }]}>{bloodType}</Text>
              )}
           </View>
           <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="heart" size={24} color="#EF4444" />
              <Text style={[styles.cardLabel, { color: colors.subText }]}>ALLERGIES</Text>
              {isEditing ? (
                <TouchableOpacity 
                  onPress={() => setShowAllergyModal(true)}
                  style={[styles.cardSelectorBtn, { borderColor: colors.border, backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.cardSelectorBtnText, { color: colors.text }]} numberOfLines={1}>{allergies}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.subText} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cardVal, { color: colors.text }]} numberOfLines={1}>{allergies}</Text>
              )}
           </View>
        </View>

        {/* ROW OF ACTION BUTTONS */}
        <View style={styles.actionButtonRow}>
          <TouchableOpacity
            onPress={isEditing ? saveProfile : startEditing}
            style={[styles.enableBtn, { backgroundColor: colors.primary, flex: 1 }]}
          >
            <Ionicons name={isEditing ? "checkmark-circle-outline" : "create-outline"} size={22} color="#fff" />
            <Text style={styles.enableBtnText}>{isEditing ? "SAVE CHANGES" : "EDIT PROFILE"}</Text>
          </TouchableOpacity>

          {!isEditing && (
            <TouchableOpacity
              onPress={generateQRData}
              style={[styles.qrShortcutBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="qr-code-outline" size={22} color={colors.text} />
              <Text style={[styles.qrShortcutBtnText, { color: colors.text }]}>MY QR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ACTION LIST */}
        <View style={[styles.actionList, { backgroundColor: colors.card, borderColor: colors.border }]}>
           {[
              { id: '1', label: 'Medical History', icon: 'medical' },
              { id: '2', label: 'Insurance Policy', icon: 'shield-checkmark' },
              { id: '4', label: 'Privacy Settings', icon: 'lock-closed' },
           ].map((item, idx, arr) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => handleActionPress(item)}
                style={[styles.actionItem, idx !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                 <View style={styles.actionLeft}>
                    <Ionicons name={item.icon as any} size={22} color="#EF4444" />
                    <Text style={[styles.actionText, { color: colors.text }]}>{item.label}</Text>
                 </View>
                 <Ionicons name="chevron-forward" size={20} color={colors.subText} />
              </TouchableOpacity>
           ))}
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity onPress={handleSignOut} style={[styles.logoutBtn, { borderColor: '#EF4444' }]}>
           <Text style={[styles.logoutText, { color: '#EF4444' }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BLOOD TYPE SELECTOR MODAL */}
      <Modal
        visible={showBloodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBloodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Blood Group</Text>
              <TouchableOpacity onPress={() => setShowBloodModal(false)}>
                <Ionicons name="close-circle" size={32} color={colors.subText} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.bloodList}>
              {bloodGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.bloodOption,
                    { borderBottomColor: colors.border },
                    bloodType === group && { backgroundColor: '#EF4444' }
                  ]}
                  onPress={() => {
                    setBloodType(group);
                    setShowBloodModal(false);
                    triggerHaptic("light");
                  }}
                >
                  <Text style={[
                    styles.bloodOptionText, 
                    { color: colors.text },
                    bloodType === group && { color: '#fff', fontWeight: '900' }
                  ]}>
                    {group === "Not Set" ? group : `Blood Type: ${group}`}
                  </Text>
                  {bloodType === group && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SEARCHABLE ALLERGY SELECTOR MODAL */}
      <Modal
        visible={showAllergyModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAllergyModal(false);
          setAllergySearch("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Allergies</Text>
              <TouchableOpacity onPress={() => {
                setShowAllergyModal(false);
                setAllergySearch("");
              }}>
                <Ionicons name="close-circle" size={32} color={colors.subText} />
              </TouchableOpacity>
            </View>

            {/* SEARCH INPUT */}
            <View style={[styles.searchBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.subText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search or type custom allergy..."
                placeholderTextColor={colors.subText}
                value={allergySearch}
                onChangeText={setAllergySearch}
              />
              {allergySearch.length > 0 && (
                <TouchableOpacity onPress={() => setAllergySearch("")}>
                  <Ionicons name="close" size={20} color={colors.subText} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.bloodList} keyboardShouldPersistTaps="handled">
              {/* CUSTOM ENTRY OPTION */}
              {showCustomAllergyOption && (
                <TouchableOpacity
                  style={[
                    styles.bloodOption,
                    { borderBottomColor: colors.border, backgroundColor: 'rgba(239, 68, 68, 0.08)' }
                  ]}
                  onPress={() => {
                    setAllergies(allergySearch.trim());
                    setShowAllergyModal(false);
                    setAllergySearch("");
                    triggerHaptic("medium");
                  }}
                >
                  <Text style={[styles.bloodOptionText, { color: '#EF4444', fontWeight: '900' }]}>
                    {`Use: "${allergySearch.trim()}"`}
                  </Text>
                  <Ionicons name="add-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              )}

              {/* FILTERED LIST */}
              {filteredAllergies.map((allergy) => (
                <TouchableOpacity
                  key={allergy}
                  style={[
                    styles.bloodOption,
                    { borderBottomColor: colors.border },
                    allergies === allergy && { backgroundColor: '#EF4444' }
                  ]}
                  onPress={() => {
                    setAllergies(allergy);
                    setShowAllergyModal(false);
                    setAllergySearch("");
                    triggerHaptic("light");
                  }}
                >
                  <Text style={[
                    styles.bloodOptionText, 
                    { color: colors.text },
                    allergies === allergy && { color: '#fff', fontWeight: '900' }
                  ]}>
                    {allergy}
                  </Text>
                  {allergies === allergy && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MEDICAL HISTORY MODAL */}
      <Modal
        visible={showMedicalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMedicalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Medical History</Text>
              <TouchableOpacity onPress={() => setShowMedicalModal(false)}>
                <Ionicons name="close-circle" size={32} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.bloodList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* CHRONIC CONDITIONS CHECKLIST */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Chronic Conditions</Text>
              {["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Epilepsy"].map((cond) => {
                const isChecked = chronicConditions.includes(cond);
                return (
                  <TouchableOpacity
                    key={cond}
                    style={[styles.bloodOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      if (isChecked) {
                        setChronicConditions(chronicConditions.filter(c => c !== cond));
                      } else {
                        setChronicConditions([...chronicConditions, cond]);
                      }
                      triggerHaptic("light");
                    }}
                  >
                    <Text style={[styles.bloodOptionText, { color: colors.text }]}>{cond}</Text>
                    <Ionicons 
                      name={isChecked ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={isChecked ? "#EF4444" : colors.subText} 
                    />
                  </TouchableOpacity>
                );
              })}

              {/* MEDICATIONS INPUT */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 25 }]}>Active Medications</Text>
              <View style={[styles.medInputRow, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.medInput, { color: colors.text }]}
                  placeholder="e.g. Metformin 500mg"
                  placeholderTextColor={colors.subText}
                  value={newMedText}
                  onChangeText={setNewMedText}
                />
                <TouchableOpacity 
                  style={[styles.addMedBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    if (newMedText.trim().length > 0) {
                      setMedsList([...medsList, newMedText.trim()]);
                      setNewMedText("");
                      triggerHaptic("medium");
                    }
                  }}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* MEDICATIONS LIST */}
              {medsList.map((med, index) => (
                <View key={index} style={[styles.medItemRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>{med}</Text>
                  <TouchableOpacity onPress={() => {
                    setMedsList(medsList.filter((_, idx) => idx !== index));
                    triggerHaptic("medium");
                  }}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* ORGAN DONOR TOGGLE */}
              <View style={[styles.toggleRow, { borderBottomColor: colors.border, marginTop: 25 }]}>
                <View>
                  <Text style={[styles.toggleTitle, { color: colors.text }]}>Organ Donor</Text>
                  <Text style={{ color: colors.subText, fontSize: 12 }}>Check if you are registered as a donor</Text>
                </View>
                <Switch
                  value={organDonor}
                  onValueChange={(val) => {
                    setOrganDonor(val);
                    triggerHaptic("light");
                  }}
                  trackColor={{ false: colors.border, true: '#EF4444' }}
                  thumbColor="#fff"
                />
              </View>

              {/* SAVE BUTTON */}
              <TouchableOpacity 
                style={[styles.modalSaveBtn, { backgroundColor: '#EF4444' }]}
                onPress={saveMedicalHistory}
              >
                <Text style={styles.modalSaveBtnText}>SAVE MEDICAL HISTORY</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* INSURANCE POLICY MODAL */}
      <Modal
        visible={showInsuranceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInsuranceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Insurance Policy</Text>
              <TouchableOpacity onPress={() => setShowInsuranceModal(false)}>
                <Ionicons name="close-circle" size={32} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.bloodList} keyboardShouldPersistTaps="handled">
              {/* INSURANCE PROVIDER */}
              <Text style={[styles.inputLabelHeader, { color: colors.text }]}>Insurance Provider</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.accent }]}
                placeholder="e.g. Star Health Insurance"
                placeholderTextColor={colors.subText}
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
              />

              {/* POLICY NUMBER */}
              <Text style={[styles.inputLabelHeader, { color: colors.text, marginTop: 15 }]}>Policy Number / ID</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.accent }]}
                placeholder="e.g. STAR-98721A"
                placeholderTextColor={colors.subText}
                value={policyNumber}
                onChangeText={setPolicyNumber}
              />

              {/* TPA HELPLINE */}
              <Text style={[styles.inputLabelHeader, { color: colors.text, marginTop: 15 }]}>TPA Claim Helpline</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.accent }]}
                placeholder="e.g. 1800-425-2255"
                placeholderTextColor={colors.subText}
                value={tpaPhone}
                onChangeText={setTpaPhone}
                keyboardType="phone-pad"
              />

              {/* SAVE BUTTON */}
              <TouchableOpacity 
                style={[styles.modalSaveBtn, { backgroundColor: '#EF4444', marginTop: 30 }]}
                onPress={saveInsurance}
              >
                <Text style={styles.modalSaveBtnText}>SAVE INSURANCE POLICY</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PRIVACY SETTINGS MODAL */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy Settings</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close-circle" size={32} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.bloodList} keyboardShouldPersistTaps="handled">
              {/* LOCATION MODE */}
              <Text style={[styles.inputLabelHeader, { color: colors.text }]}>Location Tracking Mode</Text>
              <View style={styles.locationSelectorContainer}>
                <TouchableOpacity
                  style={[
                    styles.locationModeBtn,
                    { borderColor: colors.border },
                    locationSharing === "always" && { backgroundColor: '#EF4444', borderColor: '#EF4444' }
                  ]}
                  onPress={() => {
                    setLocationSharing("always");
                    triggerHaptic("medium");
                  }}
                >
                  <Ionicons name="navigate" size={18} color={locationSharing === "always" ? "#fff" : colors.text} />
                  <Text style={[styles.locationModeText, { color: locationSharing === "always" ? "#fff" : colors.text }]}>
                    Always Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.locationModeBtn,
                    { borderColor: colors.border },
                    locationSharing === "sos" && { backgroundColor: '#EF4444', borderColor: '#EF4444' }
                  ]}
                  onPress={() => {
                    setLocationSharing("sos");
                    triggerHaptic("medium");
                  }}
                >
                  <Ionicons name="alert-circle" size={18} color={locationSharing === "sos" ? "#fff" : colors.text} />
                  <Text style={[styles.locationModeText, { color: locationSharing === "sos" ? "#fff" : colors.text }]}>
                    SOS Mode Only
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.subText, fontSize: 12, marginTop: 5, paddingHorizontal: 5 }}>
                Always Active is highly recommended for automatic Crash & Fall Guard tracking.
              </Text>

              {/* COLLISION DIAGNOSTICS TOGGLE */}
              <View style={[styles.toggleRow, { borderBottomColor: colors.border, marginTop: 25 }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.toggleTitle, { color: colors.text }]}>Crash Telemetry Sharing</Text>
                  <Text style={{ color: colors.subText, fontSize: 12 }}>Send anonymized G-force readings to optimize fall guard AI</Text>
                </View>
                <Switch
                  value={shareDiagnostics}
                  onValueChange={(val) => {
                    setShareDiagnostics(val);
                    triggerHaptic("light");
                  }}
                  trackColor={{ false: colors.border, true: '#EF4444' }}
                  thumbColor="#fff"
                />
              </View>

              {/* PURGE APP DATA BUTTON */}
              <TouchableOpacity 
                style={[styles.purgeBtn, { borderColor: '#EF4444' }]}
                onPress={purgeAllData}
              >
                <Ionicons name="trash" size={18} color="#EF4444" />
                <Text style={styles.purgeBtnText}>WIPE ALL LOCAL APP DATA</Text>
              </TouchableOpacity>

              {/* SAVE BUTTON */}
              <TouchableOpacity 
                style={[styles.modalSaveBtn, { backgroundColor: '#EF4444', marginTop: 30 }]}
                onPress={savePrivacy}
              >
                <Text style={styles.modalSaveBtnText}>SAVE PRIVACY SETTINGS</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PROFILE QR CODE MODAL */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Emergency QR Pass</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close-circle" size={32} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.bloodList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* DESCRIPTION BANNER */}
              <View style={[styles.qrBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginTop: 2 }} />
                <Text style={styles.qrBannerText}>
                  First responders can scan this code with any phone camera to access your vitals offline.
                </Text>
              </View>

              {/* QR CODE CONTAINER */}
              <View style={styles.qrCenterWrapper}>
                <View style={styles.qrImageContainer}>
                  <Image
                    style={styles.qrImage}
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrString)}` }}
                  />
                </View>
              </View>

              {/* MEDICAL CARD PREVIEW */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 15 }]}>QR Content Preview</Text>
              <View style={[styles.qrPreviewBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                <Text style={[styles.qrPreviewText, { color: colors.text }]}>{qrString}</Text>
              </View>

              {/* CLOSE BUTTON */}
              <TouchableOpacity 
                style={[styles.modalSaveBtn, { backgroundColor: '#EF4444', marginTop: 25 }]}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.modalSaveBtnText}>CLOSE PASS</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 80 },
  profileHeader: { alignItems: "center", marginBottom: 30 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    padding: 4,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 60 },
  avatar: { width: "100%", height: "100%", borderRadius: 60, justifyContent: "center", alignItems: "center" },
  editBtn: { position: "absolute", bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", borderWidth: 3 },
  userName: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  userEmail: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  editInputContainer: { width: "100%", alignItems: "center", gap: 10 },
  inputWrapper: { width: "85%", justifyContent: "center", alignItems: "center", position: "relative" },
  inputName: { fontSize: 20, fontWeight: "800", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, width: "100%", textAlign: "center" },
  inputEmail: { fontSize: 14, fontWeight: "700", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, width: "100%", textAlign: "center" },
  clearInputIcon: { position: "absolute", right: 15 },
  grid: { flexDirection: "row", gap: 16, marginBottom: 20 },
  gridCard: { flex: 1, padding: 20, borderRadius: 30, borderWidth: 1, overflow: "hidden" },
  cardLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 12 },
  cardVal: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  cardInputVal: { fontSize: 15, fontWeight: "800", borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, width: "100%" },
  cardSelectorBtn: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    borderWidth: 1, 
    borderRadius: 10, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    marginTop: 6, 
    width: "100%" 
  },
  cardSelectorBtnText: { fontSize: 13, fontWeight: "800" },
  enableBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 56, borderRadius: 20, marginBottom: 30, elevation: 2 },
  enableBtnText: { color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: 1 },
  actionList: { borderRadius: 35, borderWidth: 1, overflow: "hidden" },
  actionItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  actionText: { fontSize: 16, fontWeight: "700" },
  logoutBtn: { width: "100%", height: 60, borderRadius: 25, borderWidth: 1.5, justifyContent: "center", alignItems: "center", marginTop: 30 },
  logoutText: { fontSize: 16, fontWeight: "800" },
  
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bloodList: {
    paddingBottom: 20,
  },
  bloodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderRadius: 15,
  },
  bloodOptionText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Search details
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    padding: 0,
  },
  emptySearch: {
    alignItems: "center",
    paddingVertical: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  medInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 4,
    gap: 10,
    marginBottom: 15,
  },
  medInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  addMedBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  medItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalSaveBtn: {
    height: 52,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  modalSaveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  inputLabelHeader: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  modalInput: {
    fontSize: 15,
    fontWeight: "700",
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  locationSelectorContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  locationModeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 15,
    paddingVertical: 14,
  },
  locationModeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  purgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 15,
    paddingVertical: 14,
    marginTop: 25,
  },
  purgeBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  actionButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  qrShortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderRadius: 20,
    gap: 6,
  },
  qrShortcutBtnText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  qrBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  qrBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
    lineHeight: 16,
  },
  qrCenterWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginBottom: 20,
  },
  qrImageContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrPreviewBox: {
    borderWidth: 1.5,
    borderRadius: 15,
    padding: 16,
  },
  qrPreviewText: {
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.2,
  },
});
