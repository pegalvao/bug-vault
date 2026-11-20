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
    // As pausas fixas ficam proibidas nos testes: o Page Object espera o estado
    // da tela mudar. Uma exceção precisa de um comentário que a justifique.
    files: ['tests/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
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
