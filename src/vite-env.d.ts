/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_HOSTNAME?: string;
  readonly VITE_DEV_HOSTNAME?: string;
  readonly VITE_OPENSTUDIO_API_BASE?: string;
  readonly VITE_BURSTY_BASE?: string;
  readonly VITE_MASTER_API_KEY?: string;
}
