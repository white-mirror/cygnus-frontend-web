import { contextBridge } from 'electron';
import { loadRuntimeConfig } from './runtime-config.js';

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
