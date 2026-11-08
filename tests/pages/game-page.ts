import crypto from 'node:crypto';
import { expect, type Locator, type Page } from '@playwright/test';

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAME_WIDTH = 320;
const GAME_HEIGHT = 200;

// Regiões da tela interna do jogo. O canvas tem os pixels exatos do emulador,
// então estas coordenadas valem em qualquer sistema operacional.
const REGIONS = {
  ammo: { x: 4, y: 171, width: 42, height: 18 },
  health: { x: 50, y: 171, width: 54, height: 18 },
  // Faixa do cenário à esquerda do menu: fica livre mesmo com o menu aberto.
  worldStrip: { x: 8, y: 15, width: 50, height: 145 },
} satisfies Record<string, Region>;

// Impressão digital dos números do HUD no início de uma partida:
// 50 de munição e 100% de vida.
export const NEW_GAME_HUD = {
  ammo: 'd59ce4ea31ad',
  health: 'fc9613b557a1',
} as const;

// Parado na primeira fase, o cenário varia até cerca de 5% entre duas leituras.
// Andar ou girar muda mais de 50%. Os limites ficam no espaço entre os dois.
export const IDLE_MAX_DIFF = 0.1;
export const MOVEMENT_MIN_DIFF = 0.2;

/** O jogo dentro do canvas: inicialização, leitura da tela e comandos do jogador. */
export class GamePage {
  readonly canvas: Locator;

  constructor(readonly page: Page) {
    this.canvas = page.locator('#dos');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** Espera o jogo assumir a tela: o canvas passa a ter a resolução interna. */
  async waitForBoot(): Promise<void> {
    await expect
      .poll(() => this.canvas.evaluate((c) => (c as HTMLCanvasElement).width))
      .toBe(GAME_WIDTH);
  }

  /** Abre o menu e aceita as opções padrão até entrar na primeira fase. */
  async startNewGame(): Promise<void> {
    await this.canvas.click();
    await this.toggleMenu();
    for (let step = 0; step < 3; step += 1) {
      await this.press('Enter');
      await this.page.waitForTimeout(800);
    }
    await expect.poll(() => this.ammoFingerprint()).toBe(NEW_GAME_HUD.ammo);
    await expect.poll(() => this.healthFingerprint()).toBe(NEW_GAME_HUD.health);
    // Dá tempo para a transição de tela terminar antes de medir o cenário.
    await this.page.waitForTimeout(1500);
  }

  async toggleMenu(): Promise<void> {
    await this.press('Escape');
    await this.page.waitForTimeout(800);
  }

  async walkForward(): Promise<void> {
    await this.hold('ArrowUp', 700);
  }

  async turnLeft(): Promise<void> {
    await this.hold('ArrowLeft', 400);
  }

  async turnRight(): Promise<void> {
    await this.hold('ArrowRight', 400);
  }

  async fire(): Promise<void> {
    await this.press('Control');
  }

  async frame(): Promise<Buffer> {
    return this.pixels({ x: 0, y: 0, width: GAME_WIDTH, height: GAME_HEIGHT });
  }

  async worldStrip(): Promise<Buffer> {
    return this.pixels(REGIONS.worldStrip);
  }

  async ammoFingerprint(): Promise<string> {
    return this.fingerprint(REGIONS.ammo);
  }

  async healthFingerprint(): Promise<string> {
    return this.fingerprint(REGIONS.health);
  }

  /**
   * O jogo lê o teclado em ciclos, então um toque instantâneo pode passar
   * despercebido. O atraso imita o tempo de um dedo real na tecla.
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key, { delay: 150 });
  }

  async hold(key: string, durationMs: number): Promise<void> {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(durationMs);
    await this.page.keyboard.up(key);
    await this.page.waitForTimeout(300);
  }

  /** Lê os pixels do canvas, sem o canal alfa. */
  async pixels(region: Region): Promise<Buffer> {
    const values = await this.canvas.evaluate((el, r) => {
      const context = (el as HTMLCanvasElement).getContext('2d');
      if (!context) throw new Error('Canvas sem contexto 2D');
      const { data } = context.getImageData(r.x, r.y, r.width, r.height);
      return Array.from(data.filter((_, index) => index % 4 !== 3));
    }, region);
    return Buffer.from(values);
  }

  async fingerprint(region: Region): Promise<string> {
    const digest = crypto.createHash('sha1').update(await this.pixels(region)).digest('hex');
    return digest.slice(0, 12);
  }
}

/** Fração de pixels diferentes entre duas leituras do mesmo tamanho (0 a 1). */
export function diffRatio(before: Buffer, after: Buffer): number {
  if (before.length !== after.length) throw new Error('Leituras de tamanhos diferentes');
  let changed = 0;
  for (let i = 0; i < before.length; i += 3) {
    if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) {
      changed += 1;
    }
  }
  return changed / (before.length / 3);
}
