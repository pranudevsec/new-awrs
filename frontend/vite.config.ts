import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  // Use relative paths in production so images and chunks load correctly
  // when the app is served from a subfolder or opened from the file system
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
