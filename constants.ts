import { DeviceType, PortCount } from "./types";

export const DEFAULT_TABLES_PER_CABIN = 8;
export const DEFAULT_PCS_PER_TABLE = 6;

export const DEVICE_TEMPLATES = [
  { label: "Manage Switch", type: DeviceType.MANAGE, ports: [PortCount.P12, PortCount.P24, PortCount.P48], defaultName: "SW-Manage" },
  { label: "Router", type: DeviceType.ROUTER, ports: [PortCount.P12], defaultName: "Router-Main" },
  { label: "POE Switch", type: DeviceType.POE, ports: [PortCount.P12, PortCount.P24, PortCount.P48], defaultName: "SW-POE" },
];