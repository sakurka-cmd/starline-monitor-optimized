"use client";

import type { Device } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Flame, Thermometer, Battery, Droplet, Gauge, Clock, MapPin, Trash2 } from "lucide-react";

interface DeviceCardProps {
  device: Device;
  onClick: () => void;
  onDelete: () => void;
}

export function DeviceCard({ device, onClick, onDelete }: DeviceCardProps) {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Нет данных";
    return new Date(date).toLocaleString("ru-RU");
  };

  const isRecent = (date: string | null | undefined) => {
    if (!date) return false;
    return Date.now() - new Date(date).getTime() < 5 * 60 * 1000;
  };

  return (
    <Card
      className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-white">{device.name}</CardTitle>
            <CardDescription className="text-slate-400">
              {device.device_name || "Синхронизация..."}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isRecent(device.state_timestamp) && (
              <Badge className="bg-green-600">Онлайн</Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-400"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Shield className={`h-4 w-4 ${device.arm_state ? "text-green-500" : "text-slate-500"}`} />
            <span className="text-sm text-slate-300">{device.arm_state ? "Охрана" : "Снято"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className={`h-4 w-4 ${device.ign_state ? "text-orange-500" : "text-slate-500"}`} />
            <span className="text-sm text-slate-300">{device.ign_state ? "Зажигание" : "Выкл"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-slate-300">
              {device.temp_inner?.toFixed(0) ?? "--"}° / {device.temp_engine?.toFixed(0) ?? "--"}°
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-slate-300">{device.speed ?? 0} км/ч</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-300">{device.mileage?.toLocaleString() ?? "--"} км</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-slate-300">{device.fuel_litres?.toFixed(1) ?? "--"} л</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-slate-300">{device.motohrs?.toLocaleString() ?? "--"} мч</span>
          </div>
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-green-400" />
            <span className="text-sm text-slate-300">{device.balance?.toFixed(0) ?? "--"} ₽</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">Обновлено: {formatDate(device.state_timestamp)}</p>
      </CardContent>
    </Card>
  );
}
