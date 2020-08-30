import { defineConfig } from 'umi';

export default defineConfig({
  alias: {
    '@abi': '/src/abi',
    '@services': '/src/services',
  },
  nodeModulesTransform: {
    type: 'none',
  },
});
