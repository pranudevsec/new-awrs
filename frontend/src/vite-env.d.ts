/// <reference types="vite/client" />

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
