import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function LocationScreen() {
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  if (!location) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker coordinate={location} />
    </MapView>
  );
}
