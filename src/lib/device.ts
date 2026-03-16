import { Device } from '@capacitor/device';

/**
 * Utility for device identification and information.
 */

/**
 * Gets a unique identifier for the device.
 * Uses Capacitor Device ID which is persistent across app installs on most platforms.
 */
export const getUniqueDeviceId = async (): Promise<string> => {
  try {
    const info = await Device.getId();
    return info.identifier;
  } catch (error) {
    console.error("DeviceUtils: Failed to get device ID", error);
    // Fallback to user agent + a stored random ID if native call fails (e.g., in browser)
    let browserId = localStorage.getItem('smart_campus_device_id');
    if (!browserId) {
      browserId = 'brw-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('smart_campus_device_id', browserId);
    }
    return browserId;
  }
};

/**
 * Gets detailed device info for logging/binding.
 */
export const getDeviceMetadata = async () => {
  try {
    const info = await Device.getInfo();
    return {
      model: info.model,
      platform: info.platform,
      operatingSystem: info.operatingSystem,
      osVersion: info.osVersion,
      manufacturer: info.manufacturer,
      userAgent: navigator.userAgent
    };
  } catch (error) {
    return {
      platform: 'web',
      userAgent: navigator.userAgent
    };
  }
};
