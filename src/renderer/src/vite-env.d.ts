/// <reference types="vite/client" />

interface Window {
  nexoAPI: {
    platform: string;
    version: string;
  };
}


interface NexoAPI {
  platform: string;
  version: string;
}

interface Window {
  nexoAPI: NexoAPI;
}