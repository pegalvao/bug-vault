import { test, expect } from './fixtures';
import { diffRatio } from './pages/game-page';

test.describe('Boot do emulador', () => {
  test('inicia o jogo sem erros', async ({ page, gamePage }) => {
    const logs: string[] = [];
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
      else logs.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => errors.push(`Falha de rede: ${request.url()}`));

    await gamePage.goto();
    await gamePage.waitForBoot();

    const expectedOrder = [
      '[QA Log] Emulador WebAssembly pronto. Extraindo freedoom.zip...',
      "extracting: 'FDOOM.EXE', size: 640376",
      "extracting: 'FREEDM1.WAD', size: 28795076",
      '[QA Log] Extração concluída. Executando FDOOM.EXE...',
    ];
    const positions = expectedOrder.map((text) => logs.findIndex((log) => log.includes(text)));
    expect(positions.every((position) => position >= 0), positions.join()).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(errors).toEqual([]);
  });

  test('carrega o emulador e o jogo sem depender de outros domínios', async ({ page, gamePage, baseURL }) => {
    const externalRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith(baseURL!) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        externalRequests.push(url);
      }
    });

    await gamePage.goto();
    await gamePage.waitForBoot();

    expect(externalRequests).toEqual([]);
  });

  test('desenha a tela do jogo em vez de um canvas vazio', async ({ bootedGame }) => {
    await expect
      .poll(async () => new Set(await bootedGame.frame()).size)
      .toBeGreaterThan(50);
  });

  test('anima sozinho quando ninguém joga', async ({ bootedGame }) => {
    const firstFrame = await bootedGame.frame();

    await expect
      .poll(async () => diffRatio(firstFrame, await bootedGame.frame()), { timeout: 30_000 })
      .toBeGreaterThan(0.2);
  });

  test('ativa o áudio do jogo na primeira interação', async ({ page, bootedGame }) => {
    const logs: string[] = [];
    page.on('console', (message) => logs.push(message.text()));

    await bootedGame.canvas.click();

    await expect
      .poll(() => logs.join('\n'))
      .toMatch(/áudio ativado \([1-9]\d* contexto\(s\)\)/);
  });

  test('registra o erro quando o pacote do jogo não carrega', async ({ page, gamePage }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.route('**/freedoom.zip', (route) => route.fulfill({ status: 404, body: '' }));

    await gamePage.goto();

    await expect.poll(() => errors.join('\n')).toContain('[QA Error]');
  });
});
