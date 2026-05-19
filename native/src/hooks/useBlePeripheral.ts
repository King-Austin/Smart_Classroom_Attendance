import { useState, useEffect, useCallback } from 'react';
import { startBleBroadcast, stopBleBroadcast, getBleState } from '@/lib/ble';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BleState {
  isAdvertising: boolean;
  status: 'idle' | 'advertising' | 'error';
  error?: string;
  sessionId?: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that exposes BLE peripheral (lecturer broadcast) controls.
 *
 * @param sessionId  Optional session ID tracked in state for context.
 *                   Pass the active session ID before calling startBroadcast.
 *
 * @example
 * const { state, isAdvertising, startBroadcast, stopBroadcast } = useBlePeripheral(session.id);
 * await startBroadcast(session.token);
 */
export const useBlePeripheral = (sessionId?: string) => {
  const [state, setState] = useState<BleState>(() => {
    const moduleState = getBleState();
    return {
      isAdvertising: moduleState.isAdvertising,
      status: moduleState.isAdvertising ? 'advertising' : 'idle',
      error: moduleState.error,
      sessionId,
    };
  });

  // Keep local state in sync with the module-level advertising flag.
  // The module doesn't emit events, so we poll at 1-second intervals —
  // same pattern as the original Capacitor hook.
  useEffect(() => {
    const interval = setInterval(() => {
      const moduleState = getBleState();
      setState(prev => ({
        ...prev,
        isAdvertising: moduleState.isAdvertising,
        status: moduleState.error
          ? 'error'
          : moduleState.isAdvertising
          ? 'advertising'
          : 'idle',
        error: moduleState.error,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Stop broadcasting when the component using this hook unmounts
  // (e.g. lecturer navigates away from the session screen).
  useEffect(() => {
    return () => {
      stopBleBroadcast().catch(err =>
        console.warn('[useBlePeripheral] Cleanup stopBroadcast failed:', err)
      );
    };
  }, []);

  const startBroadcast = useCallback(
    async (token: string): Promise<boolean> => {
      if (!sessionId || !token) {
        console.warn('[useBlePeripheral] startBroadcast called without sessionId or token');
        return false;
      }

      setState(prev => ({ ...prev, status: 'advertising', sessionId }));

      const success = await startBleBroadcast(sessionId, token);

      setState(prev => ({
        ...prev,
        isAdvertising: success,
        status: success ? 'advertising' : 'error',
        error: success ? undefined : getBleState().error,
        sessionId: success ? sessionId : prev.sessionId,
      }));

      return success;
    },
    [sessionId]
  );

  const stopBroadcast = useCallback(async (): Promise<void> => {
    await stopBleBroadcast();
    setState(prev => ({
      ...prev,
      isAdvertising: false,
      status: 'idle',
      error: undefined,
    }));
  }, []);

  return {
    state,
    isAdvertising: state.isAdvertising,
    startBroadcast,
    stopBroadcast,
  };
};
