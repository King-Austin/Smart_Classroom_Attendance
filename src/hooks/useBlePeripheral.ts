import { useState, useEffect, useCallback } from 'react';
import { startBleBroadcast, stopBleBroadcast, getBleState, BleState } from '@/lib/ble';
import { useToast } from '@/hooks/use-toast';

export const useBlePeripheral = (sessionId?: string) => {
  const [state, setState] = useState<BleState>(getBleState());
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getBleState());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startBroadcast = useCallback(async (token: string) => {
    if (!sessionId || !token) return false;
    const success = await startBleBroadcast(sessionId, token);
    if (success) {
      toast({
        title: "BLE Active",
        description: `Session ${token.slice(0,4)} broadcasting`,
      });
    }
    return success;
  }, [sessionId, toast]);

  const stopBroadcast = useCallback(async () => {
    await stopBleBroadcast();
    toast({
      title: "BLE Stopped",
    });
  }, [toast]);

  return {
    state,
    isAdvertising: state.isAdvertising,
    startBroadcast,
    stopBroadcast,
  };
};

