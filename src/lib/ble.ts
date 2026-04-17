import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { toast } from 'sonner';

const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const TOKEN_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';

interface BleState {
  isInitialized: boolean;
  isAdvertising: boolean;
  status: 'idle' | 'initializing' | 'ready' | 'advertising' | 'error';
  error?: string;
  sessionId?: string;
}

class BlePeripheral {
  private state: BleState = {
    isInitialized: false,
    isAdvertising: false,
    status: 'idle',
  };

  private peripheralId?: string;

  async initialize(): Promise<void> {
    try {
      this.state.status = 'initializing';
      
      // Initialize plugin
      // @ts-ignore
      await BluetoothLe.initialize({});

      // Initialize peripheral mode
      // @ts-ignore
      const peripheralResult = await BluetoothLe.initializePeripheral({});
      this.peripheralId = peripheralResult?.peripheralId || 'default';

      this.peripheralId = peripheralResult.peripheralId;
      this.state.isInitialized = true;
      this.state.status = 'ready';
      
      console.log('[BLE] Peripheral initialized:', this.peripheralId);
    } catch (error: any) {
      this.state.status = 'error';
      this.state.error = error.message;
      console.error('[BLE] Init error:', error);
      toast.error(`BLE Init Failed: ${error.message}`);
    }
  }

  async startSessionBroadcast(sessionId: string, token: string): Promise<boolean> {
    if (this.state.status !== 'ready') {
      await this.initialize();
      if (this.state.status !== 'ready') return false;
    }

    try {
      this.state.status = 'advertising';
      this.state.isAdvertising = true;
      this.state.sessionId = sessionId;

      // Clear existing services if any
      // @ts-ignore
      await BluetoothLe.removeServices({ peripheralId: this.peripheralId! });

      // @ts-ignore
      // Add session service
      await BluetoothLe.addService({
        peripheralId: this.peripheralId!,
        service: SERVICE_UUID,
        primary: true,
      });

// @ts-ignore
      // Add token characteristic (readable)
      await BluetoothLe.addCharacteristic({
        peripheralId: this.peripheralId!,
        service: SERVICE_UUID,
        characteristic: TOKEN_CHARACTERISTIC_UUID,
        properties: ['read'],
        permissions: ['readable'],
      });

// @ts-ignore
      // Write session token (as UTF8)
      const tokenBytes = new TextEncoder().encode(token);
      await BluetoothLe.writeCharacteristic({
        peripheralId: this.peripheralId!,
        service: SERVICE_UUID,
        characteristic: TOKEN_CHARACTERISTIC_UUID,
        value: Array.from(tokenBytes).map(b => ('0' + b.toString(16)).slice(-2)).join(''),
      });

// @ts-ignore
      // Optional: Add manufacturer data or name for discoverability (Xender-like)
      await (BluetoothLe as any).setPeripheralName({
        peripheralId: this.peripheralId!,
        name: `Session-${token.slice(0,4)}`,
      });

// @ts-ignore
      // Start advertising (high discoverability like Xender)
      await (BluetoothLe as any).startAdvertising({
        localName: `Session-${token.slice(0,4)}`,
        serviceUuids: [SERVICE_UUID],
      });

      console.log('[BLE] Broadcasting session', sessionId, 'token:', token);
      toast.success(`BLE Broadcasting: ${token}`);
      
      // Listen for state changes
      BluetoothLe.addListener('blePeripheralDidUpdateState', (data) => {
        console.log('[BLE] State update:', data);
      });

      return true;
    } catch (error: any) {
      this.state.status = 'error';
      this.state.error = error.message;
      console.error('[BLE] Broadcast error:', error);
      toast.error(`Broadcast Failed: ${error.message}`);
      return false;
    }
  }

  async stopSessionBroadcast(): Promise<void> {
    try {
      if (this.state.isAdvertising) {
// @ts-ignore
        await (BluetoothLe as any).stopAdvertising({ peripheralId: this.peripheralId! });
        this.state.isAdvertising = false;
        console.log('[BLE] Stopped broadcasting');
        toast.success('BLE Broadcast stopped');
      }
    } catch (error: any) {
      console.error('[BLE] Stop error:', error);
    }
  }

  getState() {
    return { ...this.state };
  }
}

// Singleton instance (Xender-like persistent service)
export const blePeripheral = new BlePeripheral();

// Exported functions for React
export const startBleBroadcast = async (sessionId: string, token: string): Promise<boolean> => {
  return await blePeripheral.startSessionBroadcast(sessionId, token);
};

export const stopBleBroadcast = async (): Promise<void> => {
  await blePeripheral.stopSessionBroadcast();
};

export const getBleState = (): BleState => {
  return blePeripheral.getState();
};
