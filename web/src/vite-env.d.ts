/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'http';
  readonly VITE_API_URL?: string;
  /** Demo gate for /admin — see features/admin/AdminGate.tsx. Not a secret. */
  readonly VITE_ADMIN_PASSCODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
