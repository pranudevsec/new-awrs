
interface OptionType {
  value: string;
  label: string;
}

interface Meta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string;
  // add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}