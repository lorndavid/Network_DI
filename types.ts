// Hardware Types
export enum DeviceType {
  MANAGE = 'Manage',
  ROUTER = 'Router',
  POE = 'POE'
}

export enum PortCount {
  P12 = "12",
  P24 = "24",
  P48 = "48"
}

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  ports: string;
}

export interface PC {
  status: 'connected' | 'offline'; // Removed 'idle'
  port?: string;
  sourceDeviceId?: string; // Link to specific device ID
  sourceDeviceName?: string; // Cache name for easier display
}

export interface Table {
  name: string;
  pcs: Record<string, PC>;
}

export interface Cabin {
  number: string; // This is the ID (e.g., R-01)
  type: 'RA' | 'RB';
  createdAt: number;
  devices: Device[]; // Flexible array of devices
  tables: Record<string, Table>;
}

// Data Structure for Firebase: zones/RA/{id} and zones/RB/{id}
export interface Zones {
  RA: Record<string, Cabin>;
  RB: Record<string, Cabin>;
}

export interface Stats {
  total: number;
  active: number;
  offline: number;
  totalCabins: number;
}