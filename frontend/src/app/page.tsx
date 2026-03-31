"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AuthForm } from "@/components/features/auth-form";
import { DeviceCard } from "@/components/features/device-card";
import { AddDeviceDialog } from "@/components/features/add-device-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import type { Device, ServiceType, MaintenanceRecord, UpcomingMaintenance, DeviceState, Stats } from "@/lib/types";
import { Plus, LogOut, AlertTriangle, Shield, Flame, Gauge, Battery, MapPin, Droplet, Clock, ArrowLeft, Trash2, Wrench } from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated, isLoading, login, register, logout, checkAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onLogin={login} onRegister={register} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-xl font-bold text-white">StarLine Monitor</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">{user?.name || user?.email}</span>
            <Button variant="ghost" onClick={logout} className="text-slate-400 hover:text-white">
              <LogOut className="h-4 w-4 mr-2" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {selectedDevice ? (
          <DeviceDetailView deviceId={selectedDevice} onBack={() => setSelectedDevice(null)} />
        ) : (
          <DeviceListView
            onAddDevice={() => setAddDialogOpen(true)}
            onSelectDevice={setSelectedDevice}
          />
        )}
      </main>

      <AddDeviceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={async (data) => {
          await api.addDevice(data);
          queryClient.invalidateQueries({ queryKey: ["devices"] });
        }}
      />
    </div>
  );
}

function DeviceListView({ onAddDevice, onSelectDevice }: { onAddDevice: () => void; onSelectDevice: (id: number) => void }) {
  const { data: devices, isLoading } = useQuery({ queryKey: ["devices"], queryFn: () => api.getDevices() });
  const queryClient = useQueryClient();

  const handleDelete = async (id: number) => {
    if (confirm("Удалить устройство?")) {
      await api.deleteDevice(id);
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    }
  };

  if (isLoading) {
    return <div className="text-center text-slate-400 py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Мои устройства</h2>
        <Button onClick={onAddDevice} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Добавить
        </Button>
      </div>

      {!devices || devices.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center text-slate-400">
            <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Нет устройств</p>
            <p className="text-sm mt-2">Добавьте устройство для начала мониторинга</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onClick={() => onSelectDevice(device.id)}
              onDelete={() => handleDelete(device.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceDetailView({ deviceId, onBack }: { deviceId: number; onBack: () => void }) {
  const { data: latest, isLoading: loadingLatest } = useQuery({
    queryKey: ["device", deviceId, "latest"],
    queryFn: () => api.getDeviceLatest(deviceId),
  });
  
  const { data: states } = useQuery({
    queryKey: ["device", deviceId, "state"],
    queryFn: () => api.getDeviceState(deviceId, 24),
  });

  const { data: stats } = useQuery({
    queryKey: ["device", deviceId, "stats"],
    queryFn: () => api.getDeviceStats(deviceId, 7),
  });

  const { data: maintenance } = useQuery({
    queryKey: ["device", deviceId, "maintenance"],
    queryFn: () => api.getMaintenance(deviceId),
  });

  const { data: upcoming } = useQuery({
    queryKey: ["device", deviceId, "upcoming"],
    queryFn: () => api.getUpcomingMaintenance(deviceId),
  });

  const { data: serviceTypes } = useQuery({
    queryKey: ["serviceTypes"],
    queryFn: () => api.getServiceTypes(),
  });

  const queryClient = useQueryClient();

  if (loadingLatest || !latest) {
    return <div className="text-center text-slate-400 py-8">Загрузка...</div>;
  }

  const device = latest.device;
  const state = latest.state;

  const chartData = states?.map((s: DeviceState) => ({
    time: new Date(s.timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    temp_inner: s.temp_inner,
    temp_engine: s.temp_engine,
    mileage: s.mileage,
    fuel: s.fuel_litres,
  })).reverse() || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> Назад
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">{device.name}</h2>
          <p className="text-slate-400">{device.device_name || "Синхронизация..."}</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${state?.arm_state ? "text-green-500" : "text-slate-500"}`} />
              <div>
                <p className="text-sm text-slate-400">Охрана</p>
                <p className="text-lg font-semibold text-white">{state?.arm_state ? "Включена" : "Выключена"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className={`h-5 w-5 ${state?.ign_state ? "text-orange-500" : "text-slate-500"}`} />
              <div>
                <p className="text-sm text-slate-400">Зажигание</p>
                <p className="text-lg font-semibold text-white">{state?.ign_state ? "Включено" : "Выключено"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Скорость</p>
                <p className="text-lg font-semibold text-white">{state?.speed ?? 0} км/ч</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Battery className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Баланс</p>
                <p className="text-lg font-semibold text-white">{state?.balance?.toFixed(0) ?? "--"} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-cyan-400" />
              <div>
                <p className="text-sm text-slate-400">Пробег</p>
                <p className="text-2xl font-bold text-white">{state?.mileage?.toLocaleString() ?? "--"} км</p>
                {stats?.mileage_diff && <p className="text-xs text-green-400">+{stats.mileage_diff.toLocaleString()} км за 7 дней</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Droplet className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Топливо</p>
                <p className="text-2xl font-bold text-white">{state?.fuel_litres?.toFixed(1) ?? "--"} л</p>
                {stats?.fuel_stats && <p className="text-xs text-slate-400">Средн: {stats.fuel_stats.avg_fuel?.toFixed(1)} л</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Моточасы</p>
                <p className="text-2xl font-bold text-white">{state?.motohrs?.toLocaleString() ?? "--"} мч</p>
                {stats?.motohrs_diff && <p className="text-xs text-green-400">+{stats.motohrs_diff.toLocaleString()} мч за 7 дней</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Maintenance */}
      {upcoming && upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" /> Предстоящее ТО
          </h3>
          <div className="grid gap-2">
            {upcoming.map((u: UpcomingMaintenance) => (
              <Alert key={u.id} className={u.is_overdue ? "bg-red-900/30 border-red-700" : "bg-yellow-900/30 border-yellow-700"}>
                <AlertTriangle className={`h-4 w-4 ${u.is_overdue ? "text-red-500" : "text-yellow-500"}`} />
                <AlertTitle className="text-white">{u.service_type}</AlertTitle>
                <AlertDescription className="text-slate-300">
                  {u.km_left !== null && u.km_left !== undefined && <span className={u.km_left < 0 ? "text-red-400" : ""}>Осталось {u.km_left.toLocaleString()} км</span>}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Обзор</TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-slate-700">ТО</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white text-lg">Температура (24ч)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #374151" }} labelStyle={{ color: "#fff" }} />
                    <Legend />
                    <Line type="monotone" dataKey="temp_inner" stroke="#3b82f6" name="Салон" dot={false} />
                    <Line type="monotone" dataKey="temp_engine" stroke="#ef4444" name="Двигатель" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-8">
              {!maintenance || maintenance.length === 0 ? (
                <div className="text-center text-slate-400">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Записей ТО пока нет</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-400">Дата</TableHead>
                      <TableHead className="text-slate-400">Тип</TableHead>
                      <TableHead className="text-slate-400">Пробег</TableHead>
                      <TableHead className="text-slate-400">Стоимость</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.map((m: MaintenanceRecord) => (
                      <TableRow key={m.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white">{new Date(m.service_date).toLocaleDateString("ru-RU")}</TableCell>
                        <TableCell className="text-white">{m.service_type}</TableCell>
                        <TableCell className="text-white">{m.mileage_at_service?.toLocaleString() ?? "--"} км</TableCell>
                        <TableCell className="text-white">{m.cost ? `${m.cost.toLocaleString()} ₽` : "--"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
