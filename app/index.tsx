import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const onboardingDone = await AsyncStorage.getItem("onboardingDone");
        if (onboardingDone === "true") {
          setIsFirstLaunch(false);
        } else {
          setIsFirstLaunch(true);
        }
      } catch (error) {
        setIsFirstLaunch(true);
      }
    }
    checkFirstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  // If they haven't finished onboarding, show Login page.
  // Otherwise, send them straight to the main app tabs.
  if (isFirstLaunch) {
    return <Redirect href="/login" />;
  } else {
    return <Redirect href="/(tabs)" />;
  }
}
