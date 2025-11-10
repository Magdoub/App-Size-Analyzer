module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', '*.config.js'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['vue'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'vue/multi-word-component-names': 'warn',
    'vue/no-unused-vars': 'error',
    'vue/require-prop-types': 'error',
    'vue/require-default-prop': 'warn',
  },
};
