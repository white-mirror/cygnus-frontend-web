import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  resolveBghEventsUrl,
  fetchDeviceStatus,
  fetchDevices,
  fetchHomes,
  updateDeviceMode,
  type DeviceStatusDTO,
  type HomeSummary,
} from "../../api/bgh";
import { isUnauthorizedError } from "../../api/errors";
import { useAuth } from "../auth/useAuth";
import {
  ACCENT_BY_MODE,
  ACCENT_OFF,
  DEFAULT_TEMPERATURE,
  DEGREE_SYMBOL,
  FAN_SPEED_TO_API,
  MODE_TO_API,
  modeSupportsFanControl,
  modeSupportsTargetTemperature,
} from "./constants";
import type { ControlState, FanSpeed, Mode, StoredSelection } from "./types";
import {
  clampTemperature,
  formatTemperatureWithDegree,
  normaliseDevice,
  readStoredSelection,
  resolveMode,
  writeStoredSelection,
} from "./utils";

type DeviceUpdateEventPayload = {
  jobId?: string | null;
  homeId: number;
  deviceId: number;
  device: DeviceStatusDTO;
};

type CommandErrorEventPayload = {
  jobId?: string | null;
  homeId: number;
  deviceId: number;
  message: string;
};

type PendingCommand = {
  jobId: string;
  homeId: number;
  deviceId: number;
};

export interface ControlPanelHandlers {
  selectHome: (homeId: number | null) => void;
  selectDevice: (deviceId: number) => void;
  togglePanelPower: () => void;
  quickToggleDevicePower: (device: DeviceStatusDTO) => void;
  selectMode: (mode: Exclude<Mode, "off">) => void;
  selectFanSpeed: (fanSpeed: FanSpeed) => void;
  adjustTemperature: (step: number) => void;
  setTemperature: (value: number) => void;
  resetChanges: () => void;
  submitChanges: () => Promise<void>;
}

export interface ControlPanelState {
  homes: HomeSummary[];
  devices: DeviceStatusDTO[];
  selectedHomeId: number | null;
  selectedDeviceId: number | null;
  selectedHome: HomeSummary | null;
  selectedDevice: DeviceStatusDTO | null;
  controlState: ControlState | null;
  baselineState: ControlState | null;
  liveTemperature: number | null;
  isFetchingHomes: boolean;
  isFetchingDevices: boolean;
  isUpdatingDevice: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
  actualPowerOn: boolean;
  actualMode: Mode;
  previewMode: Mode;
  actualFanSpeed: FanSpeed;
  actualTargetTemperature: number;
  accentColor: string;
  modePreviewColor: string;
  confirmAccentColor: string;
  temperatureTrend: string;
  currentTemperatureLabel: string;
  targetTemperatureLabel: string;
  hasPendingChanges: boolean;
  controlsDisabled: boolean;
  temperatureControlVisible: boolean;
  fanControlVisible: boolean;
}

export interface UseControlPanelResult {
  state: ControlPanelState;
  handlers: ControlPanelHandlers;
}

export const useControlPanel = (): UseControlPanelResult => {
  const { logout } = useAuth();
  const selectionRef = useRef<StoredSelection | null>(readStoredSelection());

  const [homes, setHomes] = useState<HomeSummary[]>([]);
  const [devices, setDevices] = useState<DeviceStatusDTO[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState<number | null>(
    selectionRef.current?.homeId ?? null,
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(
    selectionRef.current?.deviceId ?? null,
  );
  const [controlState, setControlState] = useState<ControlState | null>(null);
  const [baselineState, setBaselineState] = useState<ControlState | null>(null);
  const baselineStateRef = useRef<ControlState | null>(null);
  const [liveTemperature, setLiveTemperature] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFetchingHomes, setIsFetchingHomes] = useState<boolean>(false);
  const [isFetchingDevices, setIsFetchingDevices] = useState<boolean>(false);
  const [isUpdatingDevice, setIsUpdatingDevice] = useState<boolean>(false);

  const selectedHomeIdRef = useRef<number | null>(selectedHomeId);
  const selectedDeviceIdRef = useRef<number | null>(selectedDeviceId);

  useEffect(() => {
    selectedHomeIdRef.current = selectedHomeId;
  }, [selectedHomeId]);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  useEffect(() => {
    baselineStateRef.current = baselineState;
  }, [baselineState]);

  const persistSelection = useCallback(
    (homeId: number | null, deviceId: number | null): void => {
      const payload: StoredSelection = { homeId, deviceId };
      selectionRef.current = payload;
      writeStoredSelection(payload);
    },
    [],
  );

  const lastTargetTemperatureRef = useRef<number>(DEFAULT_TEMPERATURE);
  const actualPowerOn = baselineState?.powerOn ?? false;
  const actualMode = baselineState?.mode ?? "auto";
  const actualFanSpeed = baselineState?.fanSpeed ?? "auto";
  const actualTargetTemperature = baselineState
    ? modeSupportsTargetTemperature(baselineState.mode)
      ? baselineState.temperature
      : lastTargetTemperatureRef.current
    : lastTargetTemperatureRef.current;
  const previewMode: Mode = controlState?.mode ?? actualMode;
  const temperatureControlVisible = modeSupportsTargetTemperature(previewMode);
  const fanControlVisible = modeSupportsFanControl(previewMode);

  const accentColor = useMemo(() => {
    if (actualMode === "off") {
      return ACCENT_OFF;
    }

    return ACCENT_BY_MODE[actualMode as Exclude<Mode, "off">];
  }, [actualMode]);

  const modePreviewColor = useMemo(() => {
    if (previewMode === "off") {
      return ACCENT_OFF;
    }

    return ACCENT_BY_MODE[previewMode as Exclude<Mode, "off">];
  }, [previewMode]);

  const pendingCommandsRef = useRef<Map<string, PendingCommand>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);
  const hasPendingChangesRef = useRef(false);

  const applySnapshot = useCallback(
    (homeId: number, device: DeviceStatusDTO, jobId?: string | null) => {
      const pendingCommand = jobId
        ? pendingCommandsRef.current.get(jobId)
        : undefined;

      if (jobId) {
        pendingCommandsRef.current.delete(jobId);
      }

      if (homeId === selectedHomeId) {
        setDevices((prev) => {
          const exists = prev.some((item) => item.deviceId === device.deviceId);

          if (!exists) {
            return [...prev, device];
          }

          return prev.map((item) =>
            item.deviceId === device.deviceId ? device : item,
          );
        });
      }

      if (
        homeId !== selectedHomeId ||
        selectedDeviceId === null ||
        selectedDeviceId !== device.deviceId
      ) {
        return;
      }

      const matchesPending =
        pendingCommand &&
        pendingCommand.deviceId === device.deviceId &&
        pendingCommand.homeId === homeId;

      const fallbackTemperature =
        matchesPending && controlState
          ? controlState.temperature
          : lastTargetTemperatureRef.current;
      const { control, temperature } = normaliseDevice(
        device,
        fallbackTemperature,
      );

      setLiveTemperature(temperature);
      setStatusMessage(null);
      setErrorMessage(null);

      const shouldUpdateBaseline =
        matchesPending || !hasPendingChangesRef.current;

      if (shouldUpdateBaseline) {
        setBaselineState(control);
        if (modeSupportsTargetTemperature(control.mode)) {
          lastTargetTemperatureRef.current = control.temperature;
        }
      }

      if (matchesPending) {
        setIsUpdatingDevice(false);
      }

      const shouldSyncControl = shouldUpdateBaseline;

      setControlState((prev) => {
        if (!prev || shouldSyncControl) {
          return control;
        }
        return prev;
      });
    },
    [controlState, selectedDeviceId, selectedHomeId],
  );

  const handleCommandError = useCallback(
    (payload: CommandErrorEventPayload) => {
      if (payload.jobId) {
        pendingCommandsRef.current.delete(payload.jobId);
      }

      if (
        payload.homeId !== selectedHomeId ||
        selectedDeviceId === null ||
        payload.deviceId !== selectedDeviceId
      ) {
        return;
      }

      setIsUpdatingDevice(false);
      setStatusMessage(null);
      setErrorMessage(payload.message);
    },
    [selectedDeviceId, selectedHomeId],
  );

  const applySnapshotRef = useRef(applySnapshot);
  useEffect(() => {
    applySnapshotRef.current = applySnapshot;
  }, [applySnapshot]);

  const handleCommandErrorRef = useRef(handleCommandError);
  useEffect(() => {
    handleCommandErrorRef.current = handleCommandError;
  }, [handleCommandError]);

  const refreshDevices = useCallback(async () => {
    const targetHomeId = selectedHomeIdRef.current;
    if (targetHomeId === null) {
      return;
    }

    try {
      const result = await fetchDevices(targetHomeId);
      const sorted = [...result].sort((a, b) =>
        a.deviceName.localeCompare(b.deviceName, "es", {
          sensitivity: "base",
        }),
      );

      if (selectedHomeIdRef.current !== targetHomeId) {
        return;
      }

      setDevices(sorted);

      const currentSelected = selectedDeviceIdRef.current;
      const resolvedDeviceId =
        currentSelected !== null &&
        sorted.some((device) => device.deviceId === currentSelected)
          ? currentSelected
          : (sorted[0]?.deviceId ?? null);

      if (selectedDeviceIdRef.current !== resolvedDeviceId) {
        setSelectedDeviceId(resolvedDeviceId);
      }

      selectedDeviceIdRef.current = resolvedDeviceId;
      persistSelection(targetHomeId, resolvedDeviceId);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        void logout();
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron actualizar los equipos";
      setErrorMessage(message);
    }
  }, [logout, persistSelection]);

  const refreshSelectedDevice = useCallback(async () => {
    const targetHomeId = selectedHomeIdRef.current;
    const targetDeviceId = selectedDeviceIdRef.current;

    if (targetHomeId === null || targetDeviceId === null) {
      return;
    }

    try {
      const device = await fetchDeviceStatus(targetHomeId, targetDeviceId);

      if (
        selectedHomeIdRef.current !== targetHomeId ||
        selectedDeviceIdRef.current !== targetDeviceId
      ) {
        return;
      }

      if (!device) {
        await refreshDevices();
        return;
      }

      applySnapshot(targetHomeId, device, null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        void logout();
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado del equipo";
      setErrorMessage(message);
    }
  }, [applySnapshot, logout, refreshDevices]);

  const refreshDevicesRef = useRef(refreshDevices);
  useEffect(() => {
    refreshDevicesRef.current = refreshDevices;
  }, [refreshDevices]);

  const refreshSelectedDeviceRef = useRef(refreshSelectedDevice);
  useEffect(() => {
    refreshSelectedDeviceRef.current = refreshSelectedDevice;
  }, [refreshSelectedDevice]);

  useEffect(() => {
    let isActive = true;

    setIsFetchingHomes(true);

    fetchHomes()
      .then((result) => {
        if (!isActive) {
          return;
        }

        setHomes(result);

        if (result.length === 0) {
          setSelectedHomeId(null);
          setSelectedDeviceId(null);
          selectedHomeIdRef.current = null;
          selectedDeviceIdRef.current = null;
          persistSelection(null, null);
          return;
        }

        const storedHomeId = selectionRef.current?.homeId ?? null;

        if (
          storedHomeId &&
          result.some((home) => home.HomeID === storedHomeId)
        ) {
          setSelectedHomeId(storedHomeId);
          selectedHomeIdRef.current = storedHomeId;
          return;
        }

        const fallbackHomeId = result[0].HomeID;
        setSelectedHomeId(fallbackHomeId);
        selectedHomeIdRef.current = fallbackHomeId;
        selectedDeviceIdRef.current = null;
        persistSelection(fallbackHomeId, null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          void logout();
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las casas";

        setErrorMessage(message);
      })
      .finally(() => {
        if (isActive) {
          setIsFetchingHomes(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [logout, persistSelection]);

  useEffect(() => {
    if (selectedHomeId === null) {
      setDevices([]);
      setSelectedDeviceId(null);
      selectedDeviceIdRef.current = null;
      setControlState(null);
      setBaselineState(null);
      setLiveTemperature(null);
      return;
    }

    let isActive = true;

    setIsFetchingDevices(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setControlState(null);
    setBaselineState(null);
    setLiveTemperature(null);

    fetchDevices(selectedHomeId)
      .then((result) => {
        if (!isActive) {
          return;
        }

        const sorted = [...result].sort((a, b) =>
          a.deviceName.localeCompare(b.deviceName, "es", {
            sensitivity: "base",
          }),
        );

        setDevices(sorted);

        const storedSelection = selectionRef.current;
        const storedDeviceId =
          storedSelection && storedSelection.homeId === selectedHomeId
            ? storedSelection.deviceId
            : null;

        const nextDeviceId =
          storedDeviceId !== null &&
          sorted.some((device) => device.deviceId === storedDeviceId)
            ? storedDeviceId
            : (sorted[0]?.deviceId ?? null);

        setSelectedDeviceId(nextDeviceId);
        selectedDeviceIdRef.current = nextDeviceId;
        persistSelection(selectedHomeId, nextDeviceId ?? null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          void logout();
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los equipos";

        setErrorMessage(message);
        setDevices([]);
        setSelectedDeviceId(null);
        selectedDeviceIdRef.current = null;
        persistSelection(selectedHomeId, null);
      })
      .finally(() => {
        if (isActive) {
          setIsFetchingDevices(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [logout, persistSelection, selectedHomeId]);

  const selectedHome = useMemo(
    () => homes.find((home) => home.HomeID === selectedHomeId) ?? null,
    [homes, selectedHomeId],
  );

  const selectedDevice = useMemo(
    () =>
      devices.find((device) => device.deviceId === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  useEffect(() => {
    if (!selectedDevice) {
      setControlState(null);
      setBaselineState(null);
      setLiveTemperature(null);
      return;
    }

    const { control, temperature } = normaliseDevice(
      selectedDevice,
      lastTargetTemperatureRef.current,
    );

    setLiveTemperature(temperature);

    const shouldUpdateStructures =
      !hasPendingChangesRef.current || !baselineStateRef.current;

    if (shouldUpdateStructures) {
      setBaselineState((prev) => {
        if (
          prev &&
          prev.powerOn === control.powerOn &&
          prev.mode === control.mode &&
          prev.fanSpeed === control.fanSpeed &&
          prev.temperature === control.temperature
        ) {
          return prev;
        }
        return control;
      });
      if (modeSupportsTargetTemperature(control.mode)) {
        lastTargetTemperatureRef.current = control.temperature;
      }
    }

    setControlState((prev) => {
      if (!prev || shouldUpdateStructures) {
        return control;
      }
      return prev;
    });
  }, [selectedDevice]);

  const controlsDisabled = controlState === null || isUpdatingDevice;

  const hasPendingChanges = useMemo(() => {
    if (!controlState || !baselineState) {
      return false;
    }

    return (
      controlState.powerOn !== baselineState.powerOn ||
      controlState.mode !== baselineState.mode ||
      controlState.fanSpeed !== baselineState.fanSpeed ||
      controlState.temperature !== baselineState.temperature
    );
  }, [baselineState, controlState]);

  useEffect(() => {
    hasPendingChangesRef.current = hasPendingChanges;
  }, [hasPendingChanges]);

  const confirmAccentColor = useMemo(() => {
    if (!controlState || !baselineState) {
      return accentColor;
    }

    if (!hasPendingChanges) {
      return accentColor;
    }

    const currentMode = baselineState.powerOn ? baselineState.mode : "off";
    const pendingMode = controlState.powerOn ? controlState.mode : "off";

    if (pendingMode === currentMode) {
      return accentColor;
    }

    if (pendingMode === "off") {
      return ACCENT_OFF;
    }

    return ACCENT_BY_MODE[pendingMode as Exclude<Mode, "off">];
  }, [accentColor, baselineState, controlState, hasPendingChanges]);

  const temperatureTrend = useMemo(() => {
    if (!baselineState) {
      return "Selecciona un equipo";
    }

    if (!actualPowerOn || actualMode === "off") {
      return "Apagado";
    }

    if (liveTemperature === null) {
      return "Sensor no disponible";
    }

    const diff = Number(
      (baselineState.temperature - liveTemperature).toFixed(1),
    );

    if (Math.abs(diff) < 0.2) {
      return "Temperatura estable";
    }

    const action = diff > 0 ? "Calentando" : "Enfriando";
    return `${action} ${Math.abs(diff).toFixed(1)}${DEGREE_SYMBOL}`;
  }, [actualMode, actualPowerOn, baselineState, liveTemperature]);

  const currentTemperatureLabel = formatTemperatureWithDegree(
    liveTemperature === null ? null : Number(liveTemperature.toFixed(1)),
  );

  const targetTemperatureLabel =
    controlState && temperatureControlVisible
      ? controlState.temperature.toString().padStart(2, "0")
      : "--";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const source = new EventSource(resolveBghEventsUrl(), {
      withCredentials: true,
    });
    eventSourceRef.current = source;

    const handleUpdate = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as DeviceUpdateEventPayload;
        if (applySnapshotRef.current) {
          applySnapshotRef.current(
            payload.homeId,
            payload.device,
            payload.jobId ?? null,
          );
        }
      } catch (error) {
        console.error(
          "[control-panel] Error parsing device update event",
          error,
        );
      }
    };

    const handleErrorEvent = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as CommandErrorEventPayload;
        if (handleCommandErrorRef.current) {
          handleCommandErrorRef.current(payload);
        }
      } catch (error) {
        console.error(
          "[control-panel] Error parsing command error event",
          error,
        );
      }
    };

    source.addEventListener("device-update", handleUpdate);
    source.addEventListener("command-error", handleErrorEvent);

    source.onerror = () => {
      setStatusMessage(
        (prev) =>
          prev ?? "Conexión en tiempo real interrumpida. Reintentando...",
      );
      setIsUpdatingDevice(false);
    };

    return () => {
      source.removeEventListener("device-update", handleUpdate);
      source.removeEventListener("command-error", handleErrorEvent);
      source.close();
      eventSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    let intervalId: number | null = null;

    const stopInterval = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startInterval = () => {
      if (intervalId !== null || selectedDeviceIdRef.current === null) {
        return;
      }

      intervalId = window.setInterval(() => {
        if (document.visibilityState !== "visible") {
          return;
        }

        if (selectedDeviceIdRef.current === null) {
          stopInterval();
          return;
        }

        const refresh = refreshSelectedDeviceRef.current;
        if (refresh) {
          void refresh();
        }
      }, 30000);
    };

    const runActiveRefresh = () => {
      const refreshList = refreshDevicesRef.current;
      if (refreshList) {
        void refreshList();
      }

      if (selectedDeviceIdRef.current !== null) {
        const refreshDevice = refreshSelectedDeviceRef.current;
        if (refreshDevice) {
          void refreshDevice();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runActiveRefresh();
        startInterval();
      } else {
        stopInterval();
      }
    };

    const handleWindowFocus = () => {
      if (document.visibilityState === "visible") {
        runActiveRefresh();
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    if (document.visibilityState === "visible") {
      runActiveRefresh();
      startInterval();
    } else {
      stopInterval();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      stopInterval();
    };
  }, [selectedDeviceId]);

  const applyPowerCommand = useCallback(
    async (
      deviceId: number | null,
      powerOn: boolean,
      contextDevice?: DeviceStatusDTO,
    ) => {
      if (selectedHomeId === null || deviceId === null) {
        return;
      }

      const fallbackTemperature =
        contextDevice?.targetTemperature ?? actualTargetTemperature;

      const targetTemperature = clampTemperature(
        Math.round(
          typeof fallbackTemperature === "number"
            ? fallbackTemperature
            : DEFAULT_TEMPERATURE,
        ),
      );

      const commandMode: Mode = powerOn ? "auto" : "off";

      setIsUpdatingDevice(true);
      setErrorMessage(null);
      setStatusMessage(powerOn ? "Encendiendo..." : "Apagando...");

      try {
        const { jobId } = await updateDeviceMode(deviceId, {
          mode: MODE_TO_API[commandMode],
          targetTemperature,
          fan: FAN_SPEED_TO_API.auto,
          homeId: selectedHomeId,
        });

        pendingCommandsRef.current.set(jobId, {
          jobId,
          homeId: selectedHomeId,
          deviceId,
        });
      } catch (error) {
        if (isUnauthorizedError(error)) {
          setStatusMessage(null);
          setIsUpdatingDevice(false);
          void logout();
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado";

        setErrorMessage(message);
        setStatusMessage(null);
        setIsUpdatingDevice(false);
      }
    },
    [actualTargetTemperature, logout, selectedHomeId],
  );

  const selectHome = useCallback(
    (homeId: number | null) => {
      const nextId = Number.isFinite(homeId ?? NaN) ? homeId : null;

      setSelectedHomeId(nextId);
      setSelectedDeviceId(null);
      selectedHomeIdRef.current = nextId;
      selectedDeviceIdRef.current = null;
      setControlState(null);
      setBaselineState(null);
      setLiveTemperature(null);
      setIsUpdatingDevice(false);
      setStatusMessage(null);
      setErrorMessage(null);
      persistSelection(nextId, null);
    },
    [persistSelection],
  );

  const selectDevice = useCallback(
    (deviceId: number) => {
      setSelectedDeviceId(deviceId);
      selectedDeviceIdRef.current = deviceId;
      setStatusMessage(null);
      setIsUpdatingDevice(false);
      setErrorMessage(null);

      if (selectedHomeId !== null) {
        persistSelection(selectedHomeId, deviceId);
      }
    },
    [persistSelection, selectedHomeId],
  );

  const togglePanelPower = useCallback(() => {
    if (selectedDeviceId === null) {
      return;
    }

    void applyPowerCommand(
      selectedDeviceId,
      !actualPowerOn,
      selectedDevice ?? undefined,
    );
  }, [actualPowerOn, applyPowerCommand, selectedDevice, selectedDeviceId]);

  const quickToggleDevicePower = useCallback(
    (device: DeviceStatusDTO) => {
      if (selectedHomeId === null || isUpdatingDevice) {
        return;
      }

      const deviceMode = resolveMode(device.modeId ?? null);
      const nextPowerOn = deviceMode === "off";

      if (selectedDeviceId !== device.deviceId) {
        setSelectedDeviceId(device.deviceId);
        selectedDeviceIdRef.current = device.deviceId;
        persistSelection(selectedHomeId, device.deviceId);
      }

      void applyPowerCommand(device.deviceId, nextPowerOn, device);
    },
    [
      applyPowerCommand,
      isUpdatingDevice,
      persistSelection,
      selectedDeviceId,
      selectedHomeId,
    ],
  );

  const selectMode = useCallback((mode: Exclude<Mode, "off">) => {
    setControlState((prev) => {
      if (!prev) {
        return prev;
      }

      const nextTemperature = modeSupportsTargetTemperature(mode)
        ? lastTargetTemperatureRef.current
        : prev.temperature;

      return {
        ...prev,
        mode,
        powerOn: true,
        temperature: nextTemperature,
      };
    });
  }, []);

  const selectFanSpeed = useCallback((fan: FanSpeed) => {
    setControlState((prev) => (prev ? { ...prev, fanSpeed: fan } : prev));
  }, []);

  const adjustTemperature = useCallback((step: number) => {
    setControlState((prev) => {
      if (!prev) {
        return prev;
      }

      const nextValue = clampTemperature(prev.temperature + step);
      lastTargetTemperatureRef.current = nextValue;
      return { ...prev, temperature: nextValue };
    });
  }, []);

  const setTemperature = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    setControlState((prev) => {
      if (!prev) {
        return prev;
      }

      const nextValue = clampTemperature(Math.round(value));
      lastTargetTemperatureRef.current = nextValue;
      return { ...prev, temperature: nextValue };
    });
  }, []);

  const resetChanges = useCallback(() => {
    if (baselineState && modeSupportsTargetTemperature(baselineState.mode)) {
      lastTargetTemperatureRef.current = baselineState.temperature;
    }

    setControlState((prev) => {
      if (!baselineState) {
        return prev;
      }

      return { ...baselineState };
    });
  }, [baselineState]);

  const submitChanges = useCallback(async () => {
    if (
      !controlState ||
      selectedDeviceId === null ||
      selectedHomeId === null ||
      !hasPendingChanges
    ) {
      return;
    }

    setIsUpdatingDevice(true);
    setErrorMessage(null);
    setStatusMessage("Enviando...");

    try {
      const payloadMode = MODE_TO_API[controlState.mode];
      const fanSetting = FAN_SPEED_TO_API[controlState.fanSpeed];

      const { jobId } = await updateDeviceMode(selectedDeviceId, {
        mode: payloadMode,
        targetTemperature: controlState.temperature,
        fan: fanSetting,
        homeId: selectedHomeId,
      });

      pendingCommandsRef.current.set(jobId, {
        jobId,
        homeId: selectedHomeId,
        deviceId: selectedDeviceId,
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setStatusMessage(null);
        setIsUpdatingDevice(false);
        void logout();
        return;
      }

      const message =
        error instanceof Error ? error.message : "No se pudo enviar el comando";

      setErrorMessage(message);
      setStatusMessage(null);
      setIsUpdatingDevice(false);
    }
  }, [
    controlState,
    hasPendingChanges,
    logout,
    selectedDeviceId,
    selectedHomeId,
  ]);

  const state: ControlPanelState = {
    homes,
    devices,
    selectedHomeId,
    selectedDeviceId,
    selectedHome,
    selectedDevice,
    controlState,
    baselineState,
    liveTemperature,
    isFetchingHomes,
    isFetchingDevices,
    isUpdatingDevice,
    errorMessage,
    statusMessage,
    actualPowerOn,
    actualMode,
    previewMode,
    actualFanSpeed,
    actualTargetTemperature,
    accentColor,
    confirmAccentColor,
    modePreviewColor,
    temperatureTrend,
    currentTemperatureLabel,
    targetTemperatureLabel,
    hasPendingChanges,
    controlsDisabled,
    temperatureControlVisible,
    fanControlVisible,
  };

  const handlers: ControlPanelHandlers = {
    selectHome,
    selectDevice,
    togglePanelPower,
    quickToggleDevicePower,
    selectMode,
    selectFanSpeed,
    adjustTemperature,
    setTemperature,
    resetChanges,
    submitChanges,
  };

  return { state, handlers };
};
