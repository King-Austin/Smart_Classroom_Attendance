/**
 * Web stub for `src/lib/ble.ts`.
 *
 * BLE peripheral advertising is not available in browsers. This stub keeps
 * the same public API so screens that import from `@/lib/ble` compile and
 * run on web; calls are no-ops.
 */

interface BleModuleState {
  isAdvertising: boolean;
  error?: string;
}

let _state: BleModuleState = { isAdvertising: false };

export const startBleBroadcast = async (
  _sessionId: string,
  _token: string
): Promise<boolean> => {
  _state = { isAdvertising: false, error: 'BLE not available in web preview' };
  return false;
};

export const stopBleBroadcast = async (): Promise<void> => {
  _state = { isAdvertising: false };
};

export const getBleState = (): BleModuleState => ({ ..._state });
