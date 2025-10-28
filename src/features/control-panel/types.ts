import type { ComponentType } from "react";

export type Mode = "cool" | "heat" | "auto" | "dry" | "fan" | "off";

export type FanSpeed = "auto" | "low" | "medium" | "high";

export interface ControlState {
  temperature: number;
  mode: Mode;
  fanSpeed: FanSpeed;
  powerOn: boolean;
}

export interface StoredSelection {
  homeId: number | null;
  deviceId: number | null;
}

export interface ModeOption {
  id: Exclude<Mode, "off">;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export interface FanOption {
  id: FanSpeed;
  label: string;
  description: string;
}
