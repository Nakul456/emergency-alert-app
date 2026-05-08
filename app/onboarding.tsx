import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

const steps = [
  {
    icon: "📍",
    title: "Enable Location",
    desc: "Required for emergency alerts",
    action: "Enable Location",
    key: "location",
  },

  {
    icon: "👥",
    title: "Emergency Contacts",
    desc: "Add trusted contacts later",
    action: "Continue",
    key: "contacts",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];

  const handleAction = async () => {
    // 📍 LOCATION
    if (step.key === "location") {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Needed", "Location permission is required");
        return;
      }
    }

    // 🚀 NEXT STEP
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await AsyncStorage.setItem("onboardingDone", "true");

      router.replace("/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔴 DOTS */}
      <View style={styles.dots}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentStep && styles.activeDot]}
          />
        ))}
      </View>

      {/* 📄 CONTENT */}
      <View style={styles.content}>
        <Text style={styles.icon}>{step.icon}</Text>

        <Text style={styles.title}>{step.title}</Text>

        <Text style={styles.desc}>{step.desc}</Text>
      </View>

      {/* 🚀 BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleAction}>
        <Text style={styles.buttonText}>
          {currentStep === steps.length - 1 ? "Get Started 🚀" : step.action}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 30,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 60,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ddd",
    marginHorizontal: 5,
  },

  activeDot: {
    width: 28,
    backgroundColor: "#d32f2f",
  },

  content: {
    alignItems: "center",
    marginBottom: 70,
  },

  icon: {
    fontSize: 90,
    marginBottom: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 15,
    textAlign: "center",
  },

  desc: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    lineHeight: 24,
  },

  button: {
    backgroundColor: "#d32f2f",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
