const { contextBridge } = require('electron');
const { loadRuntimeConfig } = require('./runtime-config.cjs');

const { variant = 'prod', apiBaseUrl = null } = loadRuntimeConfig();

contextBridge.exposeInMainWorld('electronEnv', {
  variant
});

contextBridge.exposeInMainWorld('cygnusDesktop', {
  variant,
  config: {
    apiBaseUrl
  }
});
