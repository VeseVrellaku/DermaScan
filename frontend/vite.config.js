import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mvcTarget = env.VITE_MVC_PROXY_TARGET || 'http://localhost:8000';
  const aiDoctorTarget = env.VITE_AI_DOCTOR_PROXY_TARGET || 'http://localhost:8001';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/mvc': {
          target: mvcTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/mvc/, '/api'),
        },
        '/api/ai-doctor': {
          target: aiDoctorTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai-doctor/, ''),
        },
        '/uploads': {
          target: mvcTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
