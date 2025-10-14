/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_API_URL?: string;
    readonly VITE_VALIDATE_TOKEN_URL?: string; // add your token URL here
    // add other VITE_ environment variables here
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  