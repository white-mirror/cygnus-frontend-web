import { app, BrowserWindow, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeConfig } from "./runtime-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const iconsDir = app.isPackaged
  ? path.join(process.resourcesPath, "icons")
  : path.join(__dirname, "..", "assets", "images");
const windowIconName = process.platform === "win32" ? "logo.ico" : "logo.png";
const windowIconPath = path.join(iconsDir, windowIconName);

const runtimeConfig = loadRuntimeConfig();
const appVariant = process.env.APP_VARIANT || runtimeConfig.variant || "prod";
const isProdVariant = appVariant === "prod";
const apiBaseUrl =
  runtimeConfig.apiBaseUrl || process.env.VITE_API_BASE_URL || null;

function logEnvironment() {
  const relevantKeys = [
    "APP_VARIANT",
    "VITE_API_BASE_URL",
    "VITE_DEV_API_PROXY",
  ];
  console.log("[electron] Variables de entorno activas:");
  for (const key of relevantKeys) {
    const value = process.env[key];
    console.log(`  - ${key}: ${value !== undefined ? value : "(sin definir)"}`);
  }
  console.log(
    `[electron] API base URL efectiva: ${apiBaseUrl ?? "(sin definir)"}`,
  );
}

function createMainWindow() {
  if (!fs.existsSync(windowIconPath)) {
    console.warn(
      `[electron] Icono no encontrado en ${windowIconPath}. Se utilizará el valor por defecto del sistema.`,
    );
  }

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: fs.existsSync(windowIconPath) ? windowIconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (!isDev && isProdVariant) {
    mainWindow.setMenu(null);
    mainWindow.setMenuBarVisibility(false);
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
    mainWindow.webContents.on("before-input-event", (event, input) => {
      const key = (input.key || "").toLowerCase();
      const isDevToolsShortcut =
        key === "f12" ||
        ((input.control || input.meta) &&
          input.shift &&
          (key === "i" || key === "j"));

      if (isDevToolsShortcut) {
        event.preventDefault();
      }
    });
  } else if (!isDev) {
    mainWindow.setMenuBarVisibility(true);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    console.log(
      `[electron] Cargando aplicación desde servidor de desarrollo: ${devUrl}`,
    );
    void mainWindow.loadURL(devUrl);
  } else {
    const indexHtml = path.join(__dirname, "..", "dist", "index.html");
    console.log(`[electron] Cargando aplicación desde archivo: ${indexHtml}`);
    void mainWindow.loadFile(indexHtml);
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.cygnus.frontend");
  console.log(
    `[electron] Iniciando Cygnus en variante "${appVariant}". Entorno empaquetado: ${app.isPackaged}`,
  );
  logEnvironment();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
