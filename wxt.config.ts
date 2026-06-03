import { defineConfig } from 'wxt';
import { APP_CONFIG } from './lib/config';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: APP_CONFIG.extension.name,
    description: APP_CONFIG.extension.description,
    permissions: ['storage'],
    host_permissions: [...APP_CONFIG.extension.hostPermissions],
  },
});

