import path from 'node:path'
import Uni from '@uni-helper/plugin-uni'
import { isMpWeixin } from '@uni-helper/uni-env'
import UniHelperComponents from '@uni-helper/vite-plugin-uni-components'
import UniHelperLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniHelperManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniHelperPages from '@uni-helper/vite-plugin-uni-pages'
import Optimization from '@uni-ku/bundle-optimizer'
import UniKuRoot from '@uni-ku/root'
import { UniEchartsResolver } from 'uni-echarts/resolver'
import { UniEcharts } from 'uni-echarts/vite'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import { WotResolver } from './src/resolver'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@stack-forge/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
      '@stack-forge/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  optimizeDeps: {
    exclude: ['@wot-ui/ui', 'uni-echarts'],
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: proxyPath => proxyPath.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    UniHelperManifest(),
    UniHelperPages({
      dts: 'src/uni-pages.d.ts',
      subPackages: [],
      exclude: ['**/components/**/*.*'],
    }),
    UniHelperLayouts(),
    UniHelperComponents({
      resolvers: [WotResolver(), UniEchartsResolver()],
      dts: 'src/components.d.ts',
      dirs: ['src/components', 'src/business'],
      directoryAsNamespace: true,
    }),
    UniKuRoot(),
    UniEcharts(),
    Uni(),
    Optimization({
      enable: isMpWeixin,
      logger: false,
    }),
    AutoImport({
      imports: ['vue', '@vueuse/core', 'pinia', 'uni-app', {
        from: '@wot-ui/router',
        imports: ['createRouter', 'useRouter', 'useRoute'],
      }, {
        from: '@wot-ui/ui',
        imports: ['useToast', 'useDialog', 'useNotify', 'CommonUtil'],
      }, {
        from: 'alova/client',
        imports: ['usePagination', 'useRequest'],
      }],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/store', 'src/utils', 'src/api'],
      vueTemplate: true,
    }),
    UnoCSS(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
})
