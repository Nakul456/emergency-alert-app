import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and fetch the direct native FCM/APNs Push Token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log("Push notifications are not supported on Web in this demo.");
    return null;
  }

  try {
    // 1. Check current permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. Request permission if not already granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission for push notifications was denied.");
      return null;
    }

    // 3. Android-specific channel setup
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("emergency-alerts", {
        name: "Emergency Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      });
    }

    // 4. Retrieve native device push token, fallback to Expo Push Token if native FCM is not ready/initialized
    let token: string | null = null;
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      token = tokenData.data;
      console.log("🔥 Native Device Push Token (FCM/APNs):", token);
    } catch (e: any) {
      console.log("⚠️ Native FCM token failed (Firebase not initialized). Falling back to Expo Push Token...");
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        const expoTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = expoTokenData.data;
        console.log("🔥 Expo Push Token (Fallback):", token);
      } catch (expoErr) {
        console.log("ℹ️ Push services not initialized on this device/emulator. Using simulated FCM token for local testing.");
        token = "Simulated-FCM-Token-CareWave-Demo";
      }
    }

    if (token) {
      // Save token locally in AsyncStorage for future backend sync
      await AsyncStorage.setItem("fcm_device_token", token);
    }
    return token;
  } catch (error) {
    console.warn("Failed to get device push token:", error);
    return null;
  }
}
