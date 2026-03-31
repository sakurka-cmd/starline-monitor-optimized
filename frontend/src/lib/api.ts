import type { User, Device, DeviceState, Stats, ServiceType, MaintenanceRecord, UpcomingMaintenance } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  }

  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await this.fetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async register(email: string, password: string, name: string): Promise<{ token: string; user: User }> {
    const response = await this.fetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(response.token);
    return response;
  }

  async getMe(): Promise<User> {
    return this.fetch<User>('/api/auth/me');
  }

  logout(): void {
    this.removeToken();
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    return this.fetch<Device[]>('/api/devices');
  }

  async addDevice(data: { name: string; app_id: string; app_secret: string; starline_login: string; starline_password: string }): Promise<{ message: string; device_id: number }> {
    return this.fetch('/api/devices', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteDevice(id: number): Promise<void> {
    await this.fetch(`/api/devices/${id}`, { method: 'DELETE' });
  }

  async getDeviceLatest(id: number): Promise<{ device: Device; state: DeviceState | null }> {
    return this.fetch(`/api/devices/${id}/latest`);
  }

  async getDeviceState(id: number, hours: number = 24): Promise<DeviceState[]> {
    return this.fetch<DeviceState[]>(`/api/devices/${id}/state?hours=${hours}`);
  }

  async getDeviceStats(id: number, days: number = 7): Promise<Stats> {
    return this.fetch<Stats>(`/api/devices/${id}/stats?days=${days}`);
  }

  // Service Types
  async getServiceTypes(): Promise<ServiceType[]> {
    return this.fetch<ServiceType[]>('/api/service-types');
  }

  // Maintenance
  async getMaintenance(deviceId: number): Promise<MaintenanceRecord[]> {
    return this.fetch<MaintenanceRecord[]>(`/api/devices/${deviceId}/maintenance`);
  }

  async addMaintenance(deviceId: number, data: Record<string, unknown>): Promise<{ id: number; message: string }> {
    return this.fetch(`/api/devices/${deviceId}/maintenance`, { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteMaintenance(deviceId: number, mid: number): Promise<void> {
    await this.fetch(`/api/devices/${deviceId}/maintenance/${mid}`, { method: 'DELETE' });
  }

  async getUpcomingMaintenance(deviceId: number): Promise<UpcomingMaintenance[]> {
    return this.fetch<UpcomingMaintenance[]>(`/api/devices/${deviceId}/maintenance/upcoming`);
  }
}

export const api = new ApiClient();
