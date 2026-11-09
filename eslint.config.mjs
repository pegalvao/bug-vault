import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    // Arquivos de terceiros e gerados não passam pelo lint.
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'public/vendor/',
      'public/source/',
    ],
  },
  js.configs.recommended,

  // Testes e configuração do Playwright, com checagem baseada nos tipos.
  {
    files: ['tests/**/*.ts', 'playwright.config.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: globals.node,
    },
  },
  {
    files: ['tests/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Os testes do jogo precisam de pausas fixas: o emulador lê o teclado em
      // ciclos e não há evento de página que avise quando o quadro mudou.
      'playwright/no-wait-for-timeout': 'off',
    },
  },

  // Script do site, que roda direto no navegador sem build.
  {
    files: ['public/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, Dos: 'readonly' },
    },
  },

  // Desliga as regras de estilo que o Prettier já cuida.
  prettier,
);
