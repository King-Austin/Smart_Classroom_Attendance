import { useState, useEffect, useRef, useCallback } from 'react';
import { NativeEventEmitter, NativeModules, EmitterSubscription } from 'react-native';
import BleManager, { Peripheral } from 'react-native-ble-manager';
import { BLE_CONFIG } from '@/constants';

const { SERVICE_UUID } = BLE_CONFIG;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScanResult {
  found: boolean;
  rssi: number;
}

// ---------------------------------------------------------------------------
// Module-level emitter (created once, reused across renders)
// ---------------------------------------------------------------------------

const bleEmitter = new NativeEventEmitter(NativeModules.BleManager);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook for student-side BLE central scanning.
 *
 * Scans for the lecturer's BLE advertisement that encodes the session token
 * in the device local name ('Session-XXXX'). Returns RSSI so the caller can
 * apply proximity thresholds (> -80 dBm is considered in-range).
 *
 * @example
 * const { scan, stopScan, isScanning } = useBleScanner();
 *
 * const result = await scan(sessionToken);
 * if (result.found && result.rssi > -80) {
 *   // close enough — proceed with attendance
 * }
 */
export const useBleScanner = () => {
  const [isScanning, setIsScanning] = useState(false);

  // Refs keep mutable values accessible inside event-listener closures
  // without requiring state updates that would re-register listeners.
  const resolveRef = useRef<((result: ScanResult) => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionRef = useRef<EmitterSubscription | null>(null);
  const foundRef = useRef(false);

  // -------------------------------------------------------------------------
  // Cleanup helper — stops the scan, clears the timeout, and removes listeners
  // -------------------------------------------------------------------------

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Remove all event listeners when the component unmounts
  useEffect(() => {
    return () => {
      cleanup();
      BleManager.stopScan().catch((err: unknown) =>
        console.warn('[useBleScanner] Cleanup stopScan failed:', err)
      );
    };
  }, [cleanup]);

  // -------------------------------------------------------------------------
  // stopScan — public API for early cancellation
  // -------------------------------------------------------------------------

  const stopScan = useCallback(() => {
    cleanup();
    BleManager.stopScan().catch((err: unknown) =>
      console.warn('[useBleScanner] stopScan failed:', err)
    );
    // Resolve any in-flight scan promise with "not found"
    if (resolveRef.current) {
      resolveRef.current({ found: false, rssi: -999 });
      resolveRef.current = null;
    }
  }, [cleanup]);

  // -------------------------------------------------------------------------
  // scan — core scanning logic
  // -------------------------------------------------------------------------

  /**
   * Starts a 10-second BLE scan and resolves when the target token is found
   * or the timeout elapses.
   *
   * RSSI guide:
   *   > -80 dBm  → strong signal, student is in the classroom
   *   ≤ -80 dBm  → weak signal, caller should warn the student
   *   -999       → peripheral not found within 10 seconds
   *
   * @param targetToken  The session token to match against ('Session-XXXX')
   */
  const scan = useCallback(
    (targetToken: string): Promise<ScanResult> => {
      return new Promise(async (resolve) => {
        // Guard: only one scan at a time
        if (isScanning) {
          console.warn('[useBleScanner] scan() called while already scanning — ignoring');
          resolve({ found: false, rssi: -999 });
          return;
        }

        foundRef.current = false;
        resolveRef.current = resolve;

        const expectedName = 'Session-' + targetToken.slice(0, 4);

        setIsScanning(true);

        try {
          // Ensure the BLE module is started before scanning
          await BleManager.start({ showAlert: false });
        } catch (err) {
          // start() throws if already initialized — safe to ignore
          console.log('[useBleScanner] BleManager.start() (may already be running):', err);
        }

        // Register the peripheral discovery listener before starting the scan
        // so we don't miss advertisements that arrive immediately.
        subscriptionRef.current = bleEmitter.addListener(
          'BleManagerDiscoverPeripheral',
          (peripheral: Peripheral) => {
            if (foundRef.current) return; // already resolved

            const name = peripheral.name ?? '';

            if (name === expectedName) {
              foundRef.current = true;

              console.log(
                `[useBleScanner] Found "${name}" with RSSI ${peripheral.rssi}`
              );

              cleanup();
              BleManager.stopScan().catch(() => {});

              if (resolveRef.current) {
                resolveRef.current({ found: true, rssi: peripheral.rssi });
                resolveRef.current = null;
              }
            }
          }
        );

        // 10-second hard timeout — resolve with "not found" if no match
        timeoutRef.current = setTimeout(() => {
          if (foundRef.current) return; // already resolved by the listener

          console.log(`[useBleScanner] Scan timed out — "${expectedName}" not found`);
          cleanup();
          BleManager.stopScan().catch(() => {});

          if (resolveRef.current) {
            resolveRef.current({ found: false, rssi: -999 });
            resolveRef.current = null;
          }
        }, 10_000);

        try {
          // Scan for our specific service UUID; allowDuplicates=false reduces noise
          await BleManager.scan({
            serviceUUIDs: [SERVICE_UUID],
            seconds: 10,
            allowDuplicates: false,
          });
        } catch (err) {
          console.error('[useBleScanner] BleManager.scan() failed:', err);
          cleanup();
          if (resolveRef.current) {
            resolveRef.current({ found: false, rssi: -999 });
            resolveRef.current = null;
          }
        }
      });
    },
    [isScanning, cleanup]
  );

  return {
    scan,
    stopScan,
    isScanning,
  };
};
