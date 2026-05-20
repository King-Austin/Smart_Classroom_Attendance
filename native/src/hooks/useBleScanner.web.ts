/**
 * Web stub for `useBleScanner`.
 *
 * BLE central scanning is not available in browsers. This stub keeps the
 * same hook API so screens that import it compile and run on web; the scan
 * resolves immediately as "not found".
 */
import { useCallback, useState } from 'react';

interface ScanResult {
  found: boolean;
  rssi: number;
}

export const useBleScanner = () => {
  const [isScanning] = useState(false);

  const scan = useCallback(async (_targetToken: string): Promise<ScanResult> => {
    return { found: false, rssi: -999 };
  }, []);

  const stopScan = useCallback(() => {}, []);

  return { scan, stopScan, isScanning };
};
