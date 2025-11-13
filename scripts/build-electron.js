#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const releaseRoot = path.join(projectRoot, "release");

function parseVariant(argv) {
  let value;
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (current.startsWith("--variant=")) {
      value = current.split("=")[1];
      break;
    }
    if (current === "--variant" || current === "-v") {
      value = args[i + 1];
      break;
    }
    if (!current.startsWith("--") && !value) {
      value = current;
      break;
    }
  }
  return value;
}

function loadEnvironmentFiles(envProfile) {
  const baseEnv = path.join(projectRoot, ".env");
  const modeEnv = path.join(projectRoot, `.env.${envProfile}`);
  const loadedFiles = [];

  if (fs.existsSync(baseEnv)) {
    dotenv.config({ path: baseEnv, override: false });
    loadedFiles.push(path.basename(baseEnv));
  }

  if (fs.existsSync(modeEnv)) {
    dotenv.config({ path: modeEnv, override: true });
    loadedFiles.push(path.basename(modeEnv));
  }

  return loadedFiles;
}

function logEnvironment({
  variant,
  envProfile,
  viteMode,
  loadedFiles,
  version,
  buildNumber,
  releaseDir,
}) {
  console.log("==========================================");
  console.log(`[electron-build] Variante seleccionada : ${variant}`);
  console.log(`[electron-build] Perfil de entorno     : ${envProfile}`);
  console.log(`[electron-build] Vite mode             : ${viteMode}`);
  console.log(
    `[electron-build] Archivos .env cargados: ${loadedFiles.length > 0 ? loadedFiles.join(", ") : "ninguno"}`,
  );
  console.log(`[electron-build] Versión               : ${version}`);
  console.log(
    `[electron-build] Build number          : ${buildNumber ?? "(sin definir)"}`,
  );
  console.log(`[electron-build] Carpeta de salida     : ${releaseDir}`);

  const keysOfInterest = Object.keys(process.env)
    .filter((key) => key.startsWith("VITE_") || key === "APP_VARIANT")
    .sort();

  if (keysOfInterest.length === 0) {
    console.log(
      "[electron-build] No se encontraron variables VITE_* para registrar.",
    );
  } else {
    console.log("[electron-build] Variables de entorno activas:");
    for (const key of keysOfInterest) {
      console.log(`  - ${key}=${process.env[key]}`);
    }
  }
  console.log("==========================================");
}

function readPackageMetadata() {
  const packageJsonPath = path.join(projectRoot, "package.json");
  try {
    const contents = fs.readFileSync(packageJsonPath, "utf8");
    const parsed = JSON.parse(contents);
    return {
      version: typeof parsed.version === "string" ? parsed.version : "0.0.0",
      buildNumber:
        typeof parsed.buildNumber === "string" && parsed.buildNumber.length > 0
          ? parsed.buildNumber
          : null,
    };
  } catch (error) {
    console.warn(
      "[electron-build] No se pudo leer package.json, se usará la versión 0.0.0",
      error,
    );
    return { version: "0.0.0", buildNumber: null };
  }
}

function writeVariantManifest({ variant, buildNumber, appVersion }) {
  const outputPath = path.join(projectRoot, "dist", "electron-variant.json");
  const payload = {
    variant,
    apiBaseUrl: process.env.VITE_API_BASE_URL ?? null,
    generatedAt: new Date().toISOString(),
    buildNumber,
    appVersion,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `[electron-build] Archivo de variante generado: ${path.relative(projectRoot, outputPath)}`,
  );
}

function runCommand(command, args, env) {
  const isWindows = process.platform === "win32";
  const finalCommand = isWindows ? process.env.ComSpec || "cmd.exe" : command;
  const finalArgs = isWindows ? ["/c", command, ...args] : args;

  const result = spawnSync(finalCommand, finalArgs, {
    stdio: "inherit",
    cwd: projectRoot,
    env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const joined = `${command} ${args.join(" ")}`.trim();
    throw new Error(
      `El comando "${joined}" finalizó con código ${result.status}.`,
    );
  }
}

function main() {
  const variant = (
    parseVariant(process.argv) ||
    process.env.APP_VARIANT ||
    "prod"
  ).toLowerCase();
  const envProfile = variant === "prod" ? "production" : variant;
  const viteMode = `electron-${variant}`;
  const loadedEnvFiles = loadEnvironmentFiles(envProfile);
  const sharedEnv = {
    ...process.env,
    APP_VARIANT: variant,
  };

  runCommand("npm", ["run", "build:web", "--", "--mode", viteMode], sharedEnv);
  runCommand("node", ["./scripts/update-build-number.mjs"], sharedEnv);

  const { version: appVersion, buildNumber } = readPackageMetadata();
  const normalizedBuildNumber = buildNumber ?? "0";
  const releaseDirName = `${variant}-${appVersion}.${normalizedBuildNumber}`;
  const releaseOutputDir = path.join(releaseRoot, releaseDirName);
  const relativeReleaseOutput =
    path.relative(projectRoot, releaseOutputDir) || releaseDirName;
  const builderOutputArg = `--config.directories.output=${relativeReleaseOutput.split(path.sep).join("/")}`;
  const buildEnv = {
    ...sharedEnv,
    APP_BUILD_NUMBER: normalizedBuildNumber,
    APP_VERSION: appVersion,
  };

  logEnvironment({
    variant,
    envProfile,
    viteMode,
    loadedFiles: loadedEnvFiles,
    version: appVersion,
    buildNumber: normalizedBuildNumber,
    releaseDir: path.relative(projectRoot, releaseOutputDir),
  });

  writeVariantManifest({
    variant,
    buildNumber: normalizedBuildNumber,
    appVersion,
  });

  fs.mkdirSync(releaseOutputDir, { recursive: true });
  runCommand(
    "npx",
    ["electron-builder", "--win", "--publish", "never", builderOutputArg],
    buildEnv,
  );

  console.log(
    `[electron-build] Paquete generado en "${path.relative(projectRoot, releaseOutputDir)}".`,
  );
}

try {
  main();
} catch (error) {
  console.error("[electron-build] Error fatal:", error);
  process.exit(1);
}
