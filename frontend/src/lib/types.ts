export interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
}

export interface Device {
  id: number;
  name: string;
  starline_device_id: string | null;
  device_name: string | null;
  is_active: number;
  last_update: string | null;
  created_at: string;
  arm_state?: number;
  ign_state?: number;
  temp_inner?: number;
  temp_engine?: number;
  balance?: number;
  latitude?: number;
  longitude?: number;
  state_timestamp?: string;
  mileage?: number;
  fuel_litres?: number;
  motohrs?: number;
  speed?: number;
  battery_voltage?: number;
}

export interface DeviceState {
  timestamp: string;
  arm_state: number;
  ign_state: number;
  temp_inner: number;
  temp_engine: number;
  balance: number;
  latitude: number;
  longitude: number;
  speed: number;
  mileage: number;
  fuel_litres: number;
  motohrs: number;
  battery_voltage: number;
}

export interface ServiceType {
  id: number;
  name: string;
  default_interval_km: number | null;
  default_interval_hours: number | null;
}

export interface MaintenanceRecord {
  id: number;
  device_id: number;
  service_type: string;
  description: string | null;
  mileage_at_service: number | null;
  motohrs_at_service: number | null;
  service_date: string;
  next_service_mileage: number | null;
  next_service_motohrs: number | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
  current_mileage?: number;
  current_motohrs?: number;
  km_since_service?: number;
  hours_since_service?: number;
}

export interface UpcomingMaintenance extends MaintenanceRecord {
  km_left?: number;
  hours_left?: number;
  is_overdue: boolean;
}

export interface Stats {
  current: { mileage: number; motohrs: number; timestamp: string } | null;
  previous: { mileage: number; motohrs: number; timestamp: string } | null;
  mileage_diff?: number;
  motohrs_diff?: number;
  fuel_stats?: { avg_fuel: number; min_fuel: number; max_fuel: number };
}
