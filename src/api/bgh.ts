import { withApiOrigin } from "./config";
import { ApiError, UnauthorizedError } from "./errors";

const API_BASE = withApiOrigin("/api/bgh");
export const BGH_EVENTS_URL = withApiOrigin("/api/bgh/events");

type LogMeta = Record<string, unknown>;

export interface HomeSummary {
  HomeID: number;
  Name?: string | null;
  [key: string]: unknown;
}

export interface DeviceStatusDTO {
  deviceId: number;
  deviceName: string;
  model: string | null;
  serialNumber: string | null;
  temperature: number | null;
  targetTemperature: number | null;
  fanSpeed: number | null;
  modeId: number | null;
}

interface HomesResponse {
  homes?: HomeSummary[];
}

interface DevicesResponse {
  devices?: Record<string, DeviceStatusDTO>;
}

interface DeviceResponse {
  device?: DeviceStatusDTO;
}

interface UpdateModeResponse {
  jobId?: string;
  position?: number;
}

export type FanSetting = "auto" | "low" | "mid" | "high";
export type ModeSetting = "off" | "cool" | "heat" | "dry" | "fan_only" | "auto";

export interface UpdateModePayload {
  mode: ModeSetting;
  targetTemperature: number;
  fan?: FanSetting;
  flags?: number;
  homeId: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const errorBody = (await response.json()) as { message?: string };
      const message =
        errorBody?.message ?? "Solicitud rechazada por el servidor";
      if (response.status === 401) {
        throw new UnauthorizedError(message);
      }
      throw new ApiError(message, response.status, errorBody);
    }
    const fallbackMessage = `Solicitud fallida con estado ${response.status}`;
    if (response.status === 401) {
      throw new UnauthorizedError(fallbackMessage);
    }
    throw new ApiError(fallbackMessage, response.status);
  }

  if (!isJson) {
    throw new Error("Respuesta inesperada del servidor");
  }

  return (await response.json()) as T;
}

async function request<T>(
  path: string,
  init: RequestInit,
  meta: LogMeta,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.info("[api:bgh] request:start", { url, ...meta });
  try {
    const response = await fetch(url, {
      ...init,
      credentials: "include",
    });
    const status = response.status;
    console.info("[api:bgh] request:response", { url, status, ...meta });
    try {
      const data = await handleResponse<T>(response);
      console.info("[api:bgh] request:success", { url, status, ...meta });
      return data;
    } catch (innerError) {
      console.error("[api:bgh] request:failure", {
        url,
        status,
        error: innerError,
        ...meta,
      });
      throw innerError;
    }
  } catch (error) {
    console.error("[api:bgh] request:error", { url, error, ...meta });
    throw error;
  }
}

export async function fetchHomes(): Promise<HomeSummary[]> {
  const data = await request<HomesResponse>(
    "/homes",
    {
      method: "GET",
    },
    { action: "fetchHomes" },
  );
  return Array.isArray(data.homes) ? data.homes : [];
}

export async function fetchDevices(homeId: number): Promise<DeviceStatusDTO[]> {
  const data = await request<DevicesResponse>(
    `/homes/${homeId}/devices`,
    {
      method: "GET",
    },
    { action: "fetchDevices", homeId },
  );
  const devicesMap = data.devices ?? {};
  return Object.values(devicesMap);
}

export async function fetchDeviceStatus(
  homeId: number,
  deviceId: number,
): Promise<DeviceStatusDTO | null> {
  const data = await request<DeviceResponse>(
    `/homes/${homeId}/devices/${deviceId}`,
    {
      method: "GET",
    },
    { action: "fetchDeviceStatus", homeId, deviceId },
  );
  return data.device ?? null;
}

export interface UpdateModeResult {
  jobId: string;
  position: number;
}

export async function updateDeviceMode(
  deviceId: number,
  payload: UpdateModePayload,
): Promise<UpdateModeResult> {
  const data = await request<UpdateModeResponse>(
    `/devices/${deviceId}/mode`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    { action: "updateDeviceMode", deviceId, payload },
  );

  if (!data.jobId) {
    throw new Error("No se obtuvo la referencia del comando");
  }

  return {
    jobId: data.jobId,
    position: typeof data.position === "number" ? data.position : 0,
  };
}
