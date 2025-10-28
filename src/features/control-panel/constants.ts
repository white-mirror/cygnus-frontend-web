import type { ModeSetting } from "../../api/bgh";
import type { FanSpeed, Mode } from "./types";

export const TEMPERATURE_MIN = 16;
export const TEMPERATURE_MAX = 30;
export const TEMPERATURE_STEP = 1;
export const DEGREE_SYMBOL = "\u00b0";
export const STORAGE_KEY = "ac-control-selection";
export const DEFAULT_TEMPERATURE = 24;

export const FAN_ID_TO_SPEED: Record<number, FanSpeed> = {
  1: "low",
  2: "medium",
  3: "high",
  254: "auto",
};

export const FAN_SPEED_TO_API: Record<
  FanSpeed,
  "auto" | "low" | "mid" | "high"
> = {
  auto: "auto",
  low: "low",
  medium: "mid",
  high: "high",
};

export const MODE_ID_TO_MODE: Record<number, Mode> = {
  0: "off",
  1: "cool",
  2: "heat",
  3: "dry",
  4: "fan",
  254: "auto",
};

export const MODE_LABELS: Record<Mode, string> = {
  cool: "Frio",
  heat: "Calor",
  dry: "Seco",
  fan: "Ventilar",
  auto: "Auto",
  off: "Apagado",
};

export const FAN_LABELS: Record<FanSpeed, string> = {
  auto: "Auto",
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

export const ACCENT_BY_MODE: Record<Exclude<Mode, "off">, string> = {
  cool: "43, 139, 255",
  heat: "255, 120, 71",
  dry: "255, 192, 105",
  fan: "90, 164, 255",
  auto: "60, 184, 120",
};

export const ACCENT_OFF = "84, 101, 128";

export const MODE_TO_API: Record<Mode, ModeSetting> = {
  auto: "auto",
  cool: "cool",
  heat: "heat",
  dry: "dry",
  fan: "fan_only",
  off: "off",
};

const MODES_WITH_TARGET_TEMPERATURE = new Set<Mode>(["auto", "cool", "heat"]);
const MODES_WITH_FAN_CONTROL = new Set<Mode>(["auto", "cool", "heat", "fan"]);

export const modeSupportsTargetTemperature = (mode: Mode): boolean => {
  if (mode === "off") {
    return false;
  }

  return MODES_WITH_TARGET_TEMPERATURE.has(mode);
};

export const modeSupportsFanControl = (mode: Mode): boolean => {
  if (mode === "off") {
    return false;
  }

  return MODES_WITH_FAN_CONTROL.has(mode);
};
