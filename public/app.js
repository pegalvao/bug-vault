// app.js - Inicialização do Freedoom (FastDoom + js-dos), otimização do canvas e liberação do áudio

(function () {
    // 1. O emulador lê o canvas a cada quadro. 'willReadFrequently' evita o aviso
    // do navegador e deixa essa leitura mais rápida.
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attributes) {
        if (type === '2d') {
            attributes = Object.assign({ willReadFrequently: true }, attributes);
        }
        return originalGetContext.call(this, type, attributes);
    };

    // 2. O navegador cria todo AudioContext suspenso até o usuário interagir com
    // a página. Guardamos os contextos que o emulador criar para retomá-los depois.
    const audioContexts = [];
    const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
    if (NativeAudioContext) {
        const TrackedAudioContext = function (options) {
            const context = new NativeAudioContext(options);
            audioContexts.push(context);
            return context;
        };
        TrackedAudioContext.prototype = NativeAudioContext.prototype;
        window.AudioContext = TrackedAudioContext;
        if (window.webkitAudioContext) window.webkitAudioContext = TrackedAudioContext;
    }

    // 3. Execução da emulação depois que o DOM carrega
    window.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById("dos");

        if (!canvas) {
            console.error("[QA Error] Elemento #dos não encontrado no DOM.");
            return;
        }

        // Inicializa o emulador js-dos v6.22
        Dos(canvas, {
            wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js"
        }).ready((fs, main) => {
            console.log("[QA Log] Emulador WebAssembly pronto. Extraindo freedoom.zip...");

            fs.extract("freedoom.zip").then(() => {
                console.log("[QA Log] Extração concluída. Executando FDOOM.EXE...");
                main(["-c", "FDOOM.EXE"]);
            }).catch((err) => {
                console.error("[QA Error] Erro ao extrair ou executar pacote do jogo:", err);
            });
        });

        // 4. Na primeira interação do usuário, retoma os contextos de áudio suspensos
        const unlockAudio = () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);

            Promise.all(audioContexts.map((context) => context.resume())).then(() => {
                console.log(`[QA Log] Interação do usuário registrada: áudio ativado (${audioContexts.length} contexto(s)).`);
            }).catch((err) => {
                console.error("[QA Error] Não foi possível ativar o áudio:", err);
            });
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
    });
})();
