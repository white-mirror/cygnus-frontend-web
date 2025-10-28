import type { DeviceStatusDTO, HomeSummary } from "../../api/bgh";
import {
  DEFAULT_TEMPERATURE,
  DEGREE_SYMBOL,
  FAN_ID_TO_SPEED,
  MODE_ID_TO_MODE,
  STORAGE_KEY,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
} from "./constants";
import type { ControlState, FanSpeed, Mode, StoredSelection } from "./types";

export const clampTemperature = (value: number): number =>
  Math.min(Math.max(value, TEMPERATURE_MIN), TEMPERATURE_MAX);

export const readStoredSelection = (): StoredSelection | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as StoredSelection;

    if (
      parsed &&
      (parsed.homeId === null || Number.isFinite(parsed.homeId)) &&
      (parsed.deviceId === null || Number.isFinite(parsed.deviceId))
    ) {
      return parsed;
    }

    return null;
  } catch (_error) {
    return null;
  }
};

export const writeStoredSelection = (selection: StoredSelection): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
};

export const resolveMode = (modeId: number | null): Mode => {
  if (modeId !== null && MODE_ID_TO_MODE[modeId]) {
    return MODE_ID_TO_MODE[modeId];
  }

  return "auto";
};

export const resolveFanSpeed = (fanSpeed: number | null): FanSpeed => {
  if (fanSpeed !== null && FAN_ID_TO_SPEED[fanSpeed]) {
    return FAN_ID_TO_SPEED[fanSpeed];
  }

  return "auto";
};

export const formatHomeName = (home: HomeSummary): string => {
  const description =
    typeof (home as { Description?: string }).Description === "string" &&
    (home as { Description?: string }).Description?.trim().length
      ? (home as { Description?: string }).Description?.trim()
      : null;

  if (description) {
    return description;
  }

  if (typeof home.Name === "string" && home.Name.trim().length > 0) {
    return home.Name.trim();
  }

  return `Home ${home.HomeID}`;
};

export interface NormalisedDevice {
  control: ControlState;
  temperature: number | null;
}

export const normaliseDevice = (
  device: DeviceStatusDTO,
  fallbackTemperature: number = DEFAULT_TEMPERATURE,
): NormalisedDevice => {
  const mode = resolveMode(device.modeId ?? null);
  const fanSpeed = resolveFanSpeed(device.fanSpeed ?? null);
  const resolvedTarget =
    typeof device.targetTemperature === "number" &&
    Number.isFinite(device.targetTemperature)
      ? device.targetTemperature
      : fallbackTemperature;
  const targetTemperature = clampTemperature(Math.round(resolvedTarget));

  const temperature =
    typeof device.temperature === "number"
      ? Number(device.temperature.toFixed(1))
      : null;

  return {
    control: {
      temperature: targetTemperature,
      fanSpeed,
      mode,
      powerOn: mode !== "off",
    },
    temperature,
  };
};

export const formatTemperatureWithDegree = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${value}${DEGREE_SYMBOL}C`;
};
