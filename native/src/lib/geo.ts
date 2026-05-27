import * as Location from 'expo-location';

/**
 * Helper for distance calculation using the Haversine formula.
 * Reliable for campus-scale geofencing (meters).
 *
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in metres
 */
export const calculateDistance = (
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number => {
  // Fail-safe: Handle missing or invalid coordinates
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    console.warn("GeoUtils: Missing coordinates provided to calculateDistance", { lat1, lon1, lat2, lon2 });
    return Infinity;
  }

  // Helper for distance calculation

  const R = 6371e3; // Earth's radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

/**
 * Requests foreground location permission and returns the device's current position.
 * Uses Balanced accuracy — a good trade-off between speed and precision for campus geofencing.
 *
 * @throws Error if permission is denied or location cannot be obtained
 * @returns An object with latitude, longitude, and accuracy (metres)
 */
export const getCurrentPosition = async (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error('GeoUtils: Location permission was denied. Cannot determine campus position.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    // accuracy can be null on some platforms; default to 0 when unavailable
    accuracy: location.coords.accuracy ?? 0,
  };
};
