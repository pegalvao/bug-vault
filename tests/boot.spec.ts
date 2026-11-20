import { test, expect } from './fixtures';
import { diffRatio } from './pages/game-page';

test.describe('Boot do emulador', () => {
  test('Inicia o jogo sem erros', { tag: '@smoke' }, async ({ pageLog, gamePage }) => {
    await gamePage.goto();
    await gamePage.waitForBoot();

    const expectedOrder = [
      '[QA Log] Emulador WebAssembly pronto. Extraindo freedoom.zip...',
      "extracting: 'FDOOM.EXE', size: 640376",
      "extracting: 'FREEDM1.WAD', size: 28795076",
      '[QA Log] Extração concluída. Executando FDOOM.EXE...',
    ];
    const positions = expectedOrder.map((text) =>
      pageLog.messages.findIndex((message) => message.includes(text)),
    );
    expect(
      positions.every((position) => position >= 0),
      positions.join(),
    ).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(pageLog.errors).toEqual([]);
  });

  test('Carrega o emulador e o jogo sem depender de outros domínios', async ({
    page,
    gamePage,
    baseURL,
  }) => {
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

  test(
    'Desenha a tela do jogo em vez de um canvas vazio',
    { tag: '@smoke' },
    async ({ bootedGame }) => {
      await expect.poll(async () => new Set(await bootedGame.frame()).size).toBeGreaterThan(50);
    },
  );

  test('Anima sozinho quando ninguém joga', async ({ bootedGame }) => {
    const firstFrame = await bootedGame.frame();

    await expect
      .poll(async () => diffRatio(firstFrame, await bootedGame.frame()), { timeout: 30_000 })
      .toBeGreaterThan(0.2);
  });

  test('Ativa o áudio do jogo na primeira interação', async ({ pageLog, bootedGame }) => {
    await bootedGame.canvas.click();

    await expect
      .poll(() => pageLog.messages.join('\n'))
      .toMatch(/áudio ativado \([1-9]\d* contexto\(s\)\)/);
  });

  test('Registra o erro quando o pacote do jogo não carrega', async ({
    page,
    pageLog,
    gamePage,
  }) => {
    await page.route('**/freedoom.zip', (route) => route.fulfill({ status: 404, body: '' }));

    await gamePage.goto();

    await expect.poll(() => pageLog.errors.join('\n')).toContain('[QA Error]');
  });

  test('Registra o erro quando o emulador não carrega', async ({ page, pageLog, gamePage }) => {
    await page.route('**/vendor/js-dos/wdosbox.wasm.js', (route) =>
      route.fulfill({ status: 404, body: '' }),
    );

    await gamePage.goto();

    await expect
      .poll(() => pageLog.errors.join('\n'))
      .toContain('[QA Error] Não foi possível carregar o emulador');
    // Sem o emulador, o jogo nunca assume o canvas.
    expect(await gamePage.canvas.evaluate((c) => (c as HTMLCanvasElement).width)).not.toBe(320);
  });
});
