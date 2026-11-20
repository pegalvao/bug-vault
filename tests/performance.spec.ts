import { test, expect } from './fixtures';

// Os orçamentos têm folga de várias vezes o valor medido, para pegar regressões
// de verdade (um pacote muito maior, o emulador sem otimização) e não oscilações
// da máquina. O valor medido fica anotado no relatório, para acompanhar a tendência.
const BOOT_BUDGET_MS = 15_000; // medido: cerca de 3,2 s
const MIN_FRAME_RATE = 15; // medido: cerca de 32 quadros por segundo (o jogo limita a 35)

test.describe('Performance', { tag: '@perf' }, () => {
  test('O jogo fica pronto dentro do orçamento de tempo', async ({ gamePage }, testInfo) => {
    const start = Date.now();
    await gamePage.goto();
    await gamePage.waitForBoot();
    const bootMs = Date.now() - start;

    testInfo.annotations.push({ type: 'boot (ms)', description: String(bootMs) });
    expect(bootMs).toBeLessThan(BOOT_BUDGET_MS);
  });

  test('Mantém uma taxa de quadros jogável ao girar a câmera', async ({
    page,
    runningGame,
  }, testInfo) => {
    // Girar redesenha o cenário inteiro a cada quadro: é o pior caso de render.
    await page.keyboard.down('ArrowLeft');
    const frameRate = await runningGame.measureFrameRate(3000);
    await page.keyboard.up('ArrowLeft');

    testInfo.annotations.push({ type: 'quadros por segundo', description: frameRate.toFixed(1) });
    expect(frameRate).toBeGreaterThanOrEqual(MIN_FRAME_RATE);
  });
});
