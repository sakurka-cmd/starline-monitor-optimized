"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { name: string; app_id: string; app_secret: string; starline_login: string; starline_password: string }) => Promise<void>;
}

export function AddDeviceDialog({ open, onOpenChange, onAdd }: AddDeviceDialogProps) {
  const [name, setName] = useState("");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd({ name, app_id: appId, app_secret: appSecret, starline_login: login, starline_password: password });
      onOpenChange(false);
      setName(""); setAppId(""); setAppSecret(""); setLogin(""); setPassword("");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Добавить устройство</DialogTitle>
          <DialogDescription className="text-slate-400">Введите данные для подключения к StarLine API</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" required />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">App ID</Label>
            <Input value={appId} onChange={(e) => setAppId(e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" required />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">App Secret</Label>
            <Input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" required />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Логин StarLine</Label>
            <Input value={login} onChange={(e) => setLogin(e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" required />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Пароль StarLine</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600">Отмена</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Добавление..." : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
