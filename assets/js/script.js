document.addEventListener('DOMContentLoaded', function () {
    const btnStart = document.getElementById('btnStart');
    const btnScramble = document.getElementById('btnScramble');
    const timerDisplay = document.getElementById('timer');
    const messageDisplay = document.getElementById('message');
    const scrambleDisplay = document.getElementById('scramble');
    const btnContainer = document.getElementById('btnContainer');
    const bestTimeDisplay = document.getElementById('best-time');
    const lastTimeDisplay = document.getElementById('last-time');
    const avg10Display = document.getElementById('avg10');
    const totalSolvesDisplay = document.getElementById('total-solves');

    const btnHistory = document.getElementById('btnHistory');
    const historyModal = document.getElementById('history-modal');
    const closeHistory = document.getElementById('close-history');
    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('btnClearHistory');
    const btnSavePng = document.getElementById('btnSavePng');

    const btnSettings = document.getElementById('btnSettings');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const btnSaveSettings = document.getElementById('btnSaveSettings');

    // VARIÁVEIS DO TIMER
    let startTime;
    let elapsedTime = 0;
    let timerInterval;
    let isRunning = false;
    let isPaused = false;
    let lastStartTime = 0;

    // ESTATÍSTICAS
    let solvesHistory = [];
    let bestTime = null;
    let lastTime = null;
    let ao10 = null;

    function generateScramble() {
        const moves = ["U", "U'", "U2", "D", "D'", "D2",
            "L", "L'", "L2", "R", "R'", "R2",
            "F", "F'", "F2", "B", "B'", "B2"];
        const scrambleLength = 20;
        let scramble = [];
        let prevMove = "";

        for (let i = 0; i < scrambleLength; i++) {
            let move;
            do {
                move = moves[Math.floor(Math.random() * moves.length)];
            } while (move.charAt(0) === prevMove.charAt(0));

            scramble.push(move);
            prevMove = move;
        }

        return scramble.join(" ");
    }

    function updateScramble() {
        scrambleDisplay.textContent = generateScramble();
    }

    // FORMATO DO TEMPO (formato fixo MM:SS.MS)
    function formatTime(ms) {
        let date = new Date(ms);
        let minutes = date.getUTCMinutes().toString().padStart(2, '0');
        let seconds = date.getUTCSeconds().toString().padStart(2, '0');
        let centiseconds = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
        return `${minutes}:${seconds}.${centiseconds}`;
    }

    function updateTimer() {
        const currentTime = Date.now();
        elapsedTime = currentTime - startTime;
        timerDisplay.textContent = formatTime(elapsedTime);
    }

    // INICIA O TIMER
    function startTimer() {
        if (!isRunning) {
            let countdown = 3;
            messageDisplay.textContent = countdown;

            const countdownInterval = setInterval(() => {
                countdown--;
                messageDisplay.textContent = countdown;

                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    messageDisplay.textContent = 'JÁ!!';
                    messageDisplay.style.color = '#10B981';

                    setTimeout(() => {
                        messageDisplay.style.fontSize = '';
                        messageDisplay.style.color = '';

                        startTime = Date.now() - elapsedTime;
                        timerInterval = setInterval(updateTimer, 10);
                        isRunning = true;
                        isPaused = false;
                        lastStartTime = Date.now();

                        btnContainer.innerHTML = '';
                        messageDisplay.textContent = 'Resolvendo...';

                        //Mensagem de instrução
                        const instruction = document.createElement('div');
                        instruction.className = 'instruction-message show';
                        instruction.textContent = 'Toque em qualquer lugar para pausar';
                        document.body.appendChild(instruction);

                        setTimeout(() => {
                            instruction.classList.remove('show');
                            setTimeout(() => {
                                document.body.removeChild(instruction);
                            }, 300);
                        }, 5000);

                        document.addEventListener('keydown', stopTimerOnSpace);
                    }, 200);
                }
            }, 1000);
        }
    }

    function stopTimerOnSpace(e) {
        if (e.code === 'Space' && isRunning) {
            e.preventDefault();
            stopTimer();
        }
    }

    function handlePause(e) {
        if (isRunning && !e.target.closest('.btn') && Date.now() - lastStartTime > 300) {
            e.preventDefault();
            stopTimer();
        }
    }

    // PARAR O TIMER
    function stopTimer() {
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;

            const existingInstruction = document.querySelector('.instruction-message');
            if (existingInstruction) {
                document.body.removeChild(existingInstruction);
            }

            btnContainer.innerHTML = `
                <div class="btn-group">
                    <button class="btn btn-primary" id="btnFinish">
                        <i class="fas fa-flag-checkered"></i> Terminei
                    </button>
                    <button class="btn btn-secondary" id="btnContinue">
                        <i class="fas fa-play"></i> Continuar
                    </button>
                </div>
                <button class="btn btn-danger" id="btnCancel">
                    <i class="fas fa-redo"></i> Reiniciar
                </button>
            `;

            document.getElementById('btnFinish').addEventListener('click', function () {
                saveTime(elapsedTime);
                updateScramble();
                resetTimer();
            });

            document.getElementById('btnContinue').addEventListener('click', function () {
                startTimer();
            });

            document.getElementById('btnCancel').addEventListener('click', function () {
                resetTimer();
            });

            messageDisplay.textContent = 'PAUSADO';
            document.removeEventListener('keydown', stopTimerOnSpace);
        }
    }

    // RESET O TIMER
    function resetTimer() {
        elapsedTime = 0;
        timerDisplay.textContent = formatTime(elapsedTime);
        isRunning = false;
        isPaused = false;

        btnContainer.innerHTML = `
            <button class="btn btn-primary" id="btnStart">
                <i class="fas fa-play"></i> Começar
            </button>
            <button class="btn btn-secondary" id="btnScramble">
                <i class="fas fa-random"></i> Gerar Scramble
            </button>
        `;

        messageDisplay.textContent = 'Pressione em COMEÇAR para iniciar';

        document.getElementById('btnStart').addEventListener('click', startTimer);
        document.getElementById('btnScramble').addEventListener('click', updateScramble);
    }

    // SALVA O TEMPO NO HISTÓRICO
    function saveTime(time) {
        const solve = {
            time: time,
            date: new Date(),
            scramble: scrambleDisplay.textContent
        };

        solvesHistory.unshift(solve);
        lastTime = time;
        updateStats();
        updateHistoryList();

        localStorage.setItem('solvesHistory', JSON.stringify(solvesHistory));
    }

    // ATUALIZA AS ESTATÍSTICAS
    function updateStats() {
        if (solvesHistory.length === 0) return;

        bestTime = Math.min(...solvesHistory.map(s => s.time));
        bestTimeDisplay.textContent = formatTime(bestTime);

        lastTimeDisplay.textContent = formatTime(lastTime);

        // Média de 10
        if (solvesHistory.length >= 10) {
            let last10 = solvesHistory.slice(0, 10).map(s => s.time);
            let max = Math.max(...last10);
            let min = Math.min(...last10);
            let sum = last10.reduce((a, b) => a + b, 0);
            ao10 = (sum - max - min) / 8;
            avg10Display.textContent = formatTime(ao10);
        } else {
            avg10Display.textContent = "--:--.--";
        }

        totalSolvesDisplay.textContent = solvesHistory.length;
    }

    // ATUALIZA A LISTA DO HISTÓRICO
    function updateHistoryList() {
        if (solvesHistory.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; padding: 40px 0; color: #95a5a6;">Nenhum tempo registrado ainda</div>';
            return;
        }

        historyList.innerHTML = solvesHistory.map((solve, index) => `
            <div class="history-item">
                <div class="history-index">${index + 1}.</div>
                <div class="history-time">${formatTime(solve.time)}</div>
                <div class="history-date">${solve.date.toLocaleString()}</div>
            </div>
        `).join('');
    }

    // LIMPA O HISTÓRICO
    function clearHistory() {
        solvesHistory = [];
        bestTime = null;
        lastTime = null;
        ao10 = null;

        bestTimeDisplay.textContent = "--:--.--";
        lastTimeDisplay.textContent = "--:--.--";
        avg10Display.textContent = "--:--.--";
        totalSolvesDisplay.textContent = "0";

        updateHistoryList();
        localStorage.removeItem('solvesHistory');
    }
    
    // SALVA O HISTÓRICO COMO PNG
    function saveAsPNG() {
        // 1. Garante que o modal está visível
        historyModal.classList.add('active');

        // 2. Cria um clone do modal para evitar problemas de renderização
        const clone = historyModal.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = '50%';
        clone.style.top = '50%';
        clone.style.transform = 'translate(-50%, -50%)';
        clone.style.zIndex = '9999';
        clone.style.opacity = '0';
        document.body.appendChild(clone);

        // 3. Configurações otimizadas para html2canvas
        html2canvas(clone.querySelector('.modal-content'), {
            scale: 2,
            backgroundColor: '#1a1a2e',
            logging: true,
            useCORS: true,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0
        }).then(canvas => {
            // 4. Cria o link de download
            const link = document.createElement('a');
            link.download = `crono-cube-historico-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // 5. Remove o clone após o uso
            document.body.removeChild(clone);
        }).catch(err => {
            console.error('Erro ao gerar PNG:', err);
            document.body.removeChild(clone);
            alert('Erro ao gerar imagem. Verifique o console para detalhes.');
        });
    }

    function loadHistory() {
        const savedHistory = localStorage.getItem('solvesHistory');
        if (savedHistory) {
            solvesHistory = JSON.parse(savedHistory);
            if (solvesHistory.length > 0) {
                lastTime = solvesHistory[0].time;
            }
            updateStats();
            updateHistoryList();
        }
    }
    // EVENTOS DE CLIQUE PARA INICIAR O TIMER
    btnStart.addEventListener('click', startTimer);
    btnScramble.addEventListener('click', updateScramble);

    // EVENTOS DE TOQUE E CLIQUE PARA PAUSAR O TIMER
    document.addEventListener('click', handlePause);
    document.addEventListener('touchstart', handlePause);

    // EVENTO DE TECLADO PARA INICIAR O TIMER
    document.addEventListener('keydown', function (e) {
        if (e.code === 'Space') {
            e.preventDefault();

            if (!isRunning) {
                startTimer();
            }
        }
    });

    // EVENTOS DOS MODAIS
    btnHistory.addEventListener('click', function () {
        historyModal.classList.add('active');
    });

    closeHistory.addEventListener('click', function () {
        historyModal.classList.remove('active');
    });

    btnClearHistory.addEventListener('click', clearHistory);

    btnSavePng.addEventListener('click', saveAsPNG);

    btnSettings.addEventListener('click', function () {
        settingsModal.classList.add('active');
    });

    closeSettings.addEventListener('click', function () {
        settingsModal.classList.remove('active');
    });

    btnSaveSettings.addEventListener('click', function () {
        settingsModal.classList.remove('active');
    });

    updateScramble();
    loadHistory();

    // CONFIGURAÇÕES DO TEMA
    const themeSelector = document.getElementById('theme-selector');

    themeSelector.addEventListener('change', function () {
        const theme = this.value;
        document.getElementById('theme-style').href =
            theme === 'light'
                ? 'assets/css/light-theme.css'
                : 'assets/css/style.css';

        localStorage.setItem('theme', theme);
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        themeSelector.value = savedTheme;
        document.getElementById('theme-style').href =
            savedTheme === 'light'
                ? 'assets/css/light-theme.css'
                : 'assets/css/style.css';
    }
});