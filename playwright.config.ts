import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  // O emulador é pesado para a CPU. Rodar um jogo por vez evita que a disputa
  // por processamento atrase o jogo e gere falhas falsas.
  workers: 1,
  // Com um worker, os testes continuam rodando um de cada vez. O fullyParallel
  // só deixa o --shard do CI dividir teste a teste, e não arquivo a arquivo,
  // o que equilibra as máquinas. Funciona porque cada teste abre a própria página.
  fullyParallel: true,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // No CI, cada shard gera um relatório parcial (blob) que depois é juntado em
  // um HTML só. O reporter `github` marca as falhas direto no código do PR.
  reporter: process.env.CI
    ? [['blob'], ['github'], ['list']]
    : [['list'], ['html', { open: 'never' }]],
  // As imagens de referência são tiradas dos pixels do emulador, iguais em
  // qualquer sistema, então o caminho não leva o nome da plataforma.
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx http-server public -p ${PORT} -a 127.0.0.1 -s -c-1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
