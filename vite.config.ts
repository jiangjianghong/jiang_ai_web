/** WARNING: DON'T EDIT THIS FILE */
/** WARNING: DON'T EDIT THIS FILE */
/** WARNING: DON'T EDIT THIS FILE */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

function getPlugins() {
  const plugins = [
    react(), 
    tsconfigPaths(),
    // 自定义插件：设置正确的MIME类型
    {
      name: 'mime-fix',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          if (url.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (url.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
          } else if (url.endsWith('.ts') || url.endsWith('.tsx')) {
            res.setHeader('Content-Type', 'text/x-typescript');
          }
          next();
        });
      }
    }
  ];
  return plugins;
}

export default defineConfig({
  // 使用根路径作为 base，适配自定义域名部署
  base: '/',
  plugins: getPlugins(),
  
  // 构建优化配置
  build: {
    // 复制.htaccess文件到构建目录
    copyPublicDir: true,
    
    // 启用文件名哈希，确保缓存失效
    rollupOptions: {
      output: {
        // 静态资源文件名包含hash，实现长期缓存
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
        // 代码分割优化
        manualChunks: {
          // 将大型第三方库单独打包
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', 'react-dnd', 'react-dnd-html5-backend'],
          'chart-vendor': ['recharts'],
        }
      }
    },
    // 启用代码压缩
    minify: 'esbuild', // 使用esbuild替代terser，速度更快
    // 启用source map但仅在开发环境
    sourcemap: process.env.NODE_ENV !== 'production',
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
  
  // 开发服务器配置
  server: {
    // WebSocket HMR 配置
    hmr: {
      port: 3003, // 使用不同端口避免冲突
      host: 'localhost'
    },
    // 代理配置 - 将API请求转发到本地代理服务器
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('代理请求:', req.method, req.url, '->', proxyReq.path);
          });
        }
      }
    },
    // 设置正确的MIME类型和缓存头
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
    // 预热常用文件
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/MainApp.tsx',
        './src/pages/Home.tsx',
        './src/components/**/*.tsx'
      ]
    }
  },
  
  // 依赖预构建优化
  optimizeDeps: {
    // 强制预构建这些依赖
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'clsx',
      'tailwind-merge'
    ],
    // 排除不需要预构建的依赖
    exclude: ['@tsparticles/react']
  },
  
  // 预览服务器配置(用于生产构建预览)
  preview: {
    // 设置安全和缓存头
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Expires': '', // 清空Expires头，使用Cache-Control
    }
  },
  
  // 实验性功能配置（当前版本暂无可用选项）
  // experimental: {
  //   // 未来可能的实验性功能
  // }
});
