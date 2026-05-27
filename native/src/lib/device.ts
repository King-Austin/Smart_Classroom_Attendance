import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'smart_campus_device_id';

/**
 * Returns a stable unique identifier for this device installation.
 *
 * expo-device does not provide a reliable cross-platform hardware ID, so we
 * generate a random ID on first launch and persist it in the OS secure keychain
 * via expo-secure-store. Subsequent calls return the stored value instantly.
 *
 * @returns A persistent unique device string (prefixed with 'rn-')
 */
export const getUniqueDeviceId = async (): Promise<string> => {
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) {
      return stored;
    }

    // First launch — generate and persist a new ID
    const newId = 'rn-' + Math.random().toString(36).substring(2, 15);
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error('DeviceUtils: Failed to read/write device ID from SecureStore', error);
    // Non-persistent fallback — will differ across app restarts but prevents a hard crash
    return 'rn-fallback-' + Math.random().toString(36).substring(2, 15);
  }
};

/**
 * Returns human-readable device metadata for logging and device-binding records.
 *
 * Fields map to their Capacitor equivalents so the Supabase schema stays unchanged:
 *   model        ← Device.modelName
 *   brand        ← Device.brand
 *   osName       ← Device.osName
 *   osVersion    ← Device.osVersion
 *   platform     ← Platform.OS  ('android' | 'ios')
 */
export const getDeviceMetadata = async (): Promise<{
  model: string | null;
  brand: string | null;
  osName: string | null;
  osVersion: string | null;
  platform: typeof Platform.OS;
}> => {
  return {
    model: Device.modelName,
    brand: Device.brand,
    osName: Device.osName,
    osVersion: Device.osVersion,
    platform: Platform.OS,
  };
};
