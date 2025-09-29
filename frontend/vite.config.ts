// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",       
    minify: "esbuild",      
    cssCodeSplit: true,     
    rollupOptions: {
      treeshake: true, 
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  esbuild: {
    drop: ["console", "debugger"], 
  },
});
