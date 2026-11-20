import crypto from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAME_WIDTH = 320;
const GAME_HEIGHT = 200;

// O boot leva entre 3 e 4 s. De vez em quando o emulador trava no prompt do
// DOS e não sai mais dali, então esperar mais não adianta: o limite só precisa
// de folga para máquinas lentas, como as do CI.
export const BOOT_TIMEOUT = 30_000;

// Regiões da tela interna do jogo. O canvas tem os pixels exatos do emulador,
// então estas coordenadas valem em qualquer sistema operacional.
const REGIONS = {
  ammo: { x: 4, y: 171, width: 42, height: 18 },
  health: { x: 50, y: 171, width: 54, height: 18 },
  // Faixa do cenário à esquerda do menu: fica livre mesmo com o menu aberto.
  worldStrip: { x: 8, y: 15, width: 50, height: 145 },
  // Todo o cenário, acima da barra de status.
  world: { x: 0, y: 0, width: GAME_WIDTH, height: 168 },
  // Onde o menu desenha as opções. Fica à direita da caveira que pisca.
  menu: { x: 90, y: 5, width: 150, height: 135 },
  statusBar: { x: 0, y: 168, width: GAME_WIDTH, height: 32 },
  // O rosto do jogador olha para os lados sozinho, então fica fora da comparação visual.
  face: { x: 143, y: 168, width: 34, height: 32 },
} satisfies Record<string, Region>;

// Impressões digitais dos números da munição e da vida no HUD. Foram capturadas
// do próprio jogo. Se o FREEDM1.WAD mudar, precisam ser recapturadas.
export const AMMO = {
  /** 50 balas: o início da partida. */
  full: 'd59ce4ea31ad',
  /** 49 balas: um único tiro de pistola. */
  afterOneShot: '42e90ae3721f',
  /** Campo vazio: o punho não usa munição. */
  none: '8e6e0fe2f398',
} as const;

export const HEALTH = {
  /** 100% de vida. */
  full: 'fc9613b557a1',
} as const;

// Parado na primeira fase, o cenário varia até cerca de 6% entre duas leituras.
// Andar ou girar muda mais de 50%. Os limites ficam no espaço entre os dois.
export const IDLE_MAX_DIFF = 0.1;
export const MOVEMENT_MIN_DIFF = 0.2;

// Na região do menu, o cenário parado varia até 15% e abrir ou fechar o menu
// muda de 37% a 47%.
const MENU_CHANGE_MIN_DIFF = 0.25;

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
    await test.step(
      'Espera o boot do emulador',
      async () => {
        await expect
          .poll(() => this.canvas.evaluate((c) => (c as HTMLCanvasElement).width), {
            message: 'O jogo não assumiu o canvas',
            timeout: BOOT_TIMEOUT,
          })
          .toBe(GAME_WIDTH);
      },
      { box: true },
    );
  }

  /**
   * Abre o menu e aceita as opções padrão até entrar na primeira fase.
   *
   * O jogo guarda as teclas numa fila e processa uma por vez, então não é
   * preciso esperar cada tela do menu. O que importa é o estado final: o HUD
   * de uma partida nova e o fim da transição de tela.
   */
  async startNewGame(): Promise<void> {
    await test.step(
      'Inicia uma partida nova',
      async () => {
        // O clique dá o foco ao canvas e libera o áudio.
        await this.canvas.click();
        for (const key of ['Escape', 'Enter', 'Enter', 'Enter']) {
          await this.press(key);
        }
        await expect
          .poll(() => this.ammoFingerprint(), { message: 'O HUD não mostra 50 de munição' })
          .toBe(AMMO.full);
        await expect
          .poll(() => this.healthFingerprint(), { message: 'O HUD não mostra 100% de vida' })
          .toBe(HEALTH.full);
        await this.waitForSettle();
      },
      { box: true },
    );
  }

  /** Abre o menu e espera o jogo pausar. */
  async openMenu(): Promise<void> {
    await test.step('Abre o menu', async () => {
      await this.pressAndWaitForChange('Escape', REGIONS.menu);
      await this.waitForPause();
    });
  }

  /** Fecha o menu e espera ele sumir da tela. */
  async closeMenu(): Promise<void> {
    await test.step('Fecha o menu', async () => {
      await this.pressAndWaitForChange('Escape', REGIONS.menu);
    });
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

  /** Um clique instantâneo passa despercebido, como acontece com o teclado. */
  async fireWithMouse(): Promise<void> {
    await this.canvas.click({ delay: 150 });
  }

  /** Troca de arma pelo número do slot (1 a 7). */
  async selectWeapon(slot: number): Promise<void> {
    await this.press(String(slot));
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

  /** Imagem PNG da barra de status, com o rosto do jogador coberto. */
  async statusBarImage(): Promise<Buffer> {
    return this.png(REGIONS.statusBar, [REGIONS.face]);
  }

  /**
   * O jogo lê o teclado em ciclos, então um toque instantâneo pode passar
   * despercebido. O atraso imita o tempo de um dedo real na tecla.
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key, { delay: 150 });
  }

  /**
   * Segura a tecla pelo tempo pedido. A duração faz parte do comando, como
   * num controle real, e não é uma espera: depois de soltar, o teste espera
   * a tela parar de mudar.
   */
  async hold(key: string, durationMs: number): Promise<void> {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(durationMs);
    await this.page.keyboard.up(key);
    await this.waitForSettle();
  }

  /** Espera a tela parar de se mover: duas leituras seguidas quase iguais. */
  async waitForSettle(region: Region = REGIONS.world): Promise<void> {
    let previous = await this.pixels(region);
    await expect
      .poll(
        async () => {
          await this.nextFrames(3);
          const current = await this.pixels(region);
          const diff = diffRatio(previous, current);
          previous = current;
          return diff;
        },
        { message: 'A tela não parou de mudar' },
      )
      .toBeLessThan(IDLE_MAX_DIFF);
  }

  /** Espera o cenário congelar por completo, o que só acontece com o jogo pausado. */
  async waitForPause(): Promise<void> {
    let previous = await this.worldStrip();
    await expect
      .poll(
        async () => {
          await this.nextFrames(3);
          const current = await this.worldStrip();
          const diff = diffRatio(previous, current);
          previous = current;
          return diff;
        },
        { message: 'O jogo não pausou' },
      )
      .toBe(0);
  }

  /** Aperta a tecla e espera a região reagir, em vez de esperar um tempo fixo. */
  async pressAndWaitForChange(key: string, region: Region): Promise<void> {
    const before = await this.pixels(region);
    await this.press(key);
    await expect
      .poll(async () => diffRatio(before, await this.pixels(region)), {
        message: `A tela não reagiu à tecla ${key}`,
      })
      .toBeGreaterThan(MENU_CHANGE_MIN_DIFF);
  }

  /** Espera o navegador desenhar `count` quadros. */
  async nextFrames(count: number): Promise<void> {
    await this.page.evaluate(async (n) => {
      for (let i = 0; i < n; i += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    }, count);
  }

  /**
   * Quantas vezes por segundo a imagem do cenário muda, medido dentro do
   * navegador para não somar a latência de cada leitura feita pelo teste.
   */
  async measureFrameRate(durationMs: number): Promise<number> {
    return this.canvas.evaluate(async (el, ms) => {
      const context = (el as HTMLCanvasElement).getContext('2d');
      if (!context) throw new Error('Canvas sem contexto 2D');
      let lastHash = 0;
      let changes = 0;
      const start = performance.now();
      while (performance.now() - start < ms) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const { data } = context.getImageData(0, 0, 320, 168);
        let hash = 0;
        // Uma amostra a cada 37 bytes basta para notar um quadro novo.
        for (let i = 0; i < data.length; i += 37) hash = (hash * 31 + data[i]) | 0;
        if (hash !== lastHash) {
          changes += 1;
          lastHash = hash;
        }
      }
      return changes / (ms / 1000);
    }, durationMs);
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
    const digest = crypto
      .createHash('sha1')
      .update(await this.pixels(region))
      .digest('hex');
    return digest.slice(0, 12);
  }

  /**
   * Recorta a região em um PNG na resolução interna do jogo. As máscaras são
   * pintadas de magenta para tirar da comparação o que muda sozinho.
   */
  async png(region: Region, masks: Region[] = []): Promise<Buffer> {
    const dataUrl = await this.canvas.evaluate(
      (el, { r, covers }) => {
        const source = (el as HTMLCanvasElement).getContext('2d');
        if (!source) throw new Error('Canvas sem contexto 2D');
        const output = document.createElement('canvas');
        output.width = r.width;
        output.height = r.height;
        const context = output.getContext('2d');
        if (!context) throw new Error('Canvas sem contexto 2D');
        context.putImageData(source.getImageData(r.x, r.y, r.width, r.height), 0, 0);
        context.fillStyle = '#ff00ff';
        for (const m of covers) context.fillRect(m.x - r.x, m.y - r.y, m.width, m.height);
        return output.toDataURL('image/png');
      },
      { r: region, covers: masks },
    );
    return Buffer.from(dataUrl.split(',')[1], 'base64');
  }
}

/** Fração de pixels diferentes entre duas leituras do mesmo tamanho (0 a 1). */
export function diffRatio(before: Buffer, after: Buffer): number {
  if (before.length !== after.length) throw new Error('Leituras de tamanhos diferentes');
  let changed = 0;
  for (let i = 0; i < before.length; i += 3) {
    if (
      before[i] !== after[i] ||
      before[i + 1] !== after[i + 1] ||
      before[i + 2] !== after[i + 2]
    ) {
      changed += 1;
    }
  }
  return changed / (before.length / 3);
}
