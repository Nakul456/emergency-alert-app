import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  const otpRef = useRef<TextInput>(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState<"phone" | "otp">("phone");

  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(30);

  // ⏳ OTP TIMER
  useEffect(() => {
    let interval: any;

    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [step, timer]);

  // 📱 VALIDATE PHONE
  const validatePhone = () => {
    const regex = /^[6-9]\d{9}$/;

    if (!regex.test(phone)) {
      Alert.alert("Invalid Number", "Enter a valid Indian mobile number");
      return false;
    }

    return true;
  };

  // 🚀 SEND OTP
  const sendOTP = async () => {
    if (!validatePhone()) return;

    setLoading(true);

    // 🔥 Simulate API
    setTimeout(() => {
      setLoading(false);

      setStep("otp");

      setTimer(30);

      Alert.alert("OTP Sent", "Use 1234 for testing");

      setTimeout(() => {
        otpRef.current?.focus();
      }, 300);
    }, 1500);
  };

  // ✅ VERIFY OTP
  const verifyOTP = async () => {
    if (otp.length < 4) {
      Alert.alert("Invalid OTP", "Please enter valid OTP");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (otp === "1234") {
        router.replace("/onboarding");
      } else {
        Alert.alert("Wrong OTP", "Please enter correct OTP");
      }
    }, 1200);
  };

  // 🔄 RESEND OTP
  const resendOTP = () => {
    if (timer > 0) return;

    Alert.alert("OTP Resent");

    setTimer(30);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 🔴 TOP SECTION */}
      <View style={styles.top}>
        <View style={styles.logoCircle}>
          <Text style={styles.logo}>🚨</Text>
        </View>

        <Text style={styles.appName}>Emergency Alert</Text>

        <Text style={styles.tagline}>Fast help when you need it most</Text>
      </View>

      {/* ⚪ LOGIN CARD */}
      <View style={styles.card}>
        {step === "phone" ? (
          <>
            <Text style={styles.title}>Login</Text>

            <Text style={styles.subtitle}>
              Enter your mobile number to continue
            </Text>

            {/* 📱 PHONE INPUT */}
            <View style={styles.phoneRow}>
              <View style={styles.countryBox}>
                <Text style={styles.countryText}>🇮🇳 +91</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* 🚀 BUTTON */}
            <TouchableOpacity
              style={styles.button}
              onPress={sendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP →</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* 🔐 OTP SCREEN */}
            <Text style={styles.title}>Verify OTP</Text>

            <Text style={styles.subtitle}>Enter code sent to +91{phone}</Text>

            <TextInput
              ref={otpRef}
              style={[styles.input, styles.otpInput]}
              placeholder="----"
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
            />

            {/* ✅ VERIFY */}
            <TouchableOpacity
              style={styles.button}
              onPress={verifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Continue →</Text>
              )}
            </TouchableOpacity>

            {/* 🔄 RESEND */}
            <TouchableOpacity onPress={resendOTP} disabled={timer > 0}>
              <Text style={styles.resend}>
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </Text>
            </TouchableOpacity>

            {/* 🔙 CHANGE NUMBER */}
            <TouchableOpacity
              onPress={() => {
                setStep("phone");
                setOtp("");
              }}
            >
              <Text style={styles.change}>← Change Number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d32f2f",
  },

  top: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 70,
  },

  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  logo: {
    fontSize: 50,
  },

  appName: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
  },

  tagline: {
    color: "#ffcdd2",
    marginTop: 8,
    fontSize: 14,
  },

  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 30,
    paddingBottom: 50,
    elevation: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#222",
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: "#777",
    lineHeight: 20,
  },

  phoneRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },

  countryBox: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 14,
    borderRadius: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },

  countryText: {
    fontWeight: "600",
  },

  input: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    fontSize: 16,
  },

  otpInput: {
    textAlign: "center",
    fontSize: 28,
    letterSpacing: 12,
    marginBottom: 22,
  },

  button: {
    backgroundColor: "#d32f2f",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  resend: {
    textAlign: "center",
    marginTop: 18,
    color: "#d32f2f",
    fontWeight: "600",
  },

  change: {
    textAlign: "center",
    marginTop: 18,
    color: "#777",
  },
});
