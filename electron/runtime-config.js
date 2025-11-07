import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.join(__dirname, '..', 'dist', 'electron-variant.json');

const defaults = {
  variant: process.env.APP_VARIANT || 'prod',
  apiBaseUrl: process.env.VITE_API_BASE_URL || null
};

export function loadRuntimeConfig() {
  try {
    if (fs.existsSync(manifestPath)) {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        variant: typeof parsed.variant === 'string' ? parsed.variant : defaults.variant,
        apiBaseUrl: typeof parsed.apiBaseUrl === 'string' && parsed.apiBaseUrl.length > 0
          ? parsed.apiBaseUrl
          : defaults.apiBaseUrl
      };
    }
  } catch (error) {
    console.warn('[electron] No se pudo leer electron-variant.json:', error);
  }

  return { ...defaults };
}

export function getManifestPath() {
  return manifestPath;
}
