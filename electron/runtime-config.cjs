const fs = require('node:fs');
const path = require('node:path');

const manifestPath = path.join(__dirname, '..', 'dist', 'electron-variant.json');

const defaults = {
  variant: process.env.APP_VARIANT || 'prod',
  apiBaseUrl: process.env.VITE_API_BASE_URL || null
};

function loadRuntimeConfig() {
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

function getManifestPath() {
  return manifestPath;
}

module.exports = {
  loadRuntimeConfig,
  getManifestPath
};
