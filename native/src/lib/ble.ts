import { Platform } from 'react-native';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { BLE_CONFIG } from '@/constants';

const { SERVICE_UUID, TOKEN_CHARACTERISTIC_UUID } = BLE_CONFIG;

// ---------------------------------------------------------------------------
// Module-level advertising state
// ---------------------------------------------------------------------------

interface BleModuleState {
  isAdvertising: boolean;
  error?: string;
}

let _state: BleModuleState = {
  isAdvertising: false,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Starts a BLE peripheral advertisement so students can discover this session.
 *
 * Android only — BLE peripheral (advertiser) mode is not available on iOS
 * due to platform restrictions. On iOS this function logs a warning and
 * returns false without attempting to advertise.
 *
 * The local name encodes the first 4 characters of the token so the student
 * scanner can match it without GATT service discovery.
 *
 * @param sessionId  The active session ID (used for logging only)
 * @param token      The session token whose prefix is embedded in the device name
 * @returns          true on success, false on failure
 */
export const startBleBroadcast = async (
  sessionId: string,
  token: string
): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    console.warn(
      '[BLE] Peripheral/advertiser mode is not supported on iOS. ' +
      'BLE broadcasting is Android-only in this app. ' +
      'Lecturers must use an Android device to host sessions.'
    );
    _state = { isAdvertising: false, error: 'iOS peripheral mode not supported' };
    return false;
  }

  try {
    await BLEAdvertiser.broadcast(
      SERVICE_UUID,
      [TOKEN_CHARACTERISTIC_UUID],
      {
        includeDeviceName: false,
        localName: 'Session-' + token.slice(0, 4),
        txPowerLevel: 'ULTRA_LOW',
      }
    );

    _state = { isAdvertising: true };
    console.log(`[BLE] Broadcasting session ${sessionId} with token prefix ${token.slice(0, 4)}`);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    _state = { isAdvertising: false, error: message };
    console.error('[BLE] startBleBroadcast failed:', error);
    return false;
  }
};

/**
 * Stops the active BLE advertisement.
 * Safe to call even if no advertisement is running.
 */
export const stopBleBroadcast = async (): Promise<void> => {
  try {
    await BLEAdvertiser.stopBroadcast();
    _state = { isAdvertising: false };
    console.log('[BLE] Broadcast stopped');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // Don't throw — the caller (hook cleanup) should not crash on unmount
    console.error('[BLE] stopBleBroadcast failed:', error);
    _state = { isAdvertising: false, error: message };
  }
};

/**
 * Returns a snapshot of the current advertising state.
 * Reads from the module-level variable updated by start/stop calls.
 */
export const getBleState = (): BleModuleState => {
  return { ..._state };
};
