import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('nexoAPI', {
  platform: process.platform,
  version: process.versions.electron,
});