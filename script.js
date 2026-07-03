// ── DOM References ──────────────────────────────────────────────────────────
const cells = document.querySelectorAll('.cell');
const board = document.getElementById('board');
const statusText = document.getElementById('status-text');
const statusDotX = document.getElementById('status-dot-x');
const statusDotO = document.getElementById('status-dot-o');
const btnRestart = document.getElementById('btn-restart');
const btnResetScores = document.getElementById('btn-reset-scores');
const btnPvP = document.getElementById('btn-pvp');
const btnPvAI = document.getElementById('btn-pvai');
const scoreXDisplay = document.getElementById('score-x');
const scoreODisplay = document.getElementById('score-o');
const scoreDrawDisplay = document.getElementById('score-draw');
const nameXDisplay = document.getElementById('name-x');
const nameODisplay = document.getElementById('name-o');
const diffRow = document.getElementById('difficulty-row');
const diffEasy = document.getElementById('diff-easy');
const diffHard = document.getElementById('diff-hard');
const modal = document.getElementById('game-over-modal');
const modalMessage = document.getElementById('modal-message');
const modalEmoji = document.getElementById('modal-emoji');
const btnPlayAgain = document.getElementById('btn-play-again');

// ── State ────────────────────────────────────────────────────────────────────
let gameBoard = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;
let isPvAI = false;
let isHardAI = true;

const scores = { X: 0, O: 0, Draw: 0 };

const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// ── Cell Click Handler ────────────────────────────────────────────────────────
function handleCellClick(e) {
    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
    if (gameBoard[idx] !== '' || !gameActive) return;
    if (isPvAI && currentPlayer === 'O') return; // AI's turn, block input

    placeMove(idx, currentPlayer);

    // After human move, trigger AI if game still active
    if (gameActive && isPvAI && currentPlayer === 'O') {
        lockBoard();
        setTimeout(makeAIMove, 450);
    }
}

// ── Place a Move ──────────────────────────────────────────────────────────────
function placeMove(idx, player) {
    gameBoard[idx] = player;
    const cell = cells[idx];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase(), 'pop');
    cell.addEventListener('animationend', () => cell.classList.remove('pop'), { once: true });

    const result = evaluateBoard();

    if (result) {
        gameActive = false;
        unlockBoard();

        if (result === 'tie') {
            scores.Draw++;
            bumpScore('draw');
            setTimeout(() => showModal("It's a Draw!", '🤝', 'Draw'), 900);
        } else {
            highlightWinningCells(result.line);
            scores[result.winner]++;
            bumpScore(result.winner);
            const label = isPvAI && result.winner === 'O' ? 'AI' : `Player ${result.winner}`;
            const emoji = result.winner === 'X' ? '🏆' : (isPvAI ? '🤖' : '🏆');
            setTimeout(() => showModal(`${label} Wins!`, emoji, result.winner), 1000);
        }

        updateScoreBoard();
        return;
    }

    // Switch turn
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
}

// ── Evaluate Board ────────────────────────────────────────────────────────────
function evaluateBoard() {
    for (const [a, b, c] of WINNING_LINES) {
        if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
            return { winner: gameBoard[a], line: [a, b, c] };
        }
    }
    if (!gameBoard.includes('')) return 'tie';
    return null;
}

// ── Highlight Winners ─────────────────────────────────────────────────────────
function highlightWinningCells(indices) {
    indices.forEach(i => cells[i].classList.add('winning-cell'));
}

// ── Scoreboard ────────────────────────────────────────────────────────────────
function updateScoreBoard() {
    scoreXDisplay.textContent = scores.X;
    scoreODisplay.textContent = scores.O;
    scoreDrawDisplay.textContent = scores.Draw;
}

function bumpScore(who) {
    const cardMap = { X: document.querySelector('.player-x'), O: document.querySelector('.player-o'), Draw: document.querySelector('.draw') };
    const card = cardMap[who] || cardMap.Draw;
    card.classList.remove('bump');
    void card.offsetWidth; // reflow to restart
    card.classList.add('bump');
    card.addEventListener('animationend', () => card.classList.remove('bump'), { once: true });
}

// ── Status Display ────────────────────────────────────────────────────────────
function updateStatus() {
    const isAITurn = isPvAI && currentPlayer === 'O';
    const txt = isAITurn ? 'AI is thinking…' : `Player ${currentPlayer}'s turn`;
    statusText.textContent = txt;

    const xColor = 'var(--x-color)';
    const oColor = 'var(--o-color)';

    if (currentPlayer === 'X') {
        document.querySelector('.status').style.color = xColor;
        statusDotX.style.cssText = `background:${xColor}; opacity:1;`;
        statusDotO.style.opacity = '0';
    } else {
        document.querySelector('.status').style.color = oColor;
        statusDotO.style.cssText = `background:${oColor}; opacity:1;`;
        statusDotX.style.opacity = '0';
    }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function showModal(message, emoji, winner) {
    modalMessage.textContent = message;
    modalEmoji.textContent = emoji;

    const colorMap = { X: 'var(--x-color)', O: 'var(--o-color)', Draw: 'var(--text-main)' };
    modalMessage.style.color = colorMap[winner] || 'var(--text-main)';

    modal.classList.add('show');
}

// ── Board Lock / Unlock ───────────────────────────────────────────────────────
function lockBoard() { board.classList.add('disabled'); }
function unlockBoard() { board.classList.remove('disabled'); }

// ── Restart Game (keep scores) ────────────────────────────────────────────────
function restartGame() {
    gameBoard = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;

    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });

    modal.classList.remove('show');
    unlockBoard();
    updateStatus();
}

// ── Reset Scores ──────────────────────────────────────────────────────────────
function resetScores() {
    scores.X = scores.O = scores.Draw = 0;
    updateScoreBoard();
    restartGame();
}

// ── Mode Selection ────────────────────────────────────────────────────────────
function setMode(mode) {
    isPvAI = mode === 'pvai';

    if (isPvAI) {
        btnPvAI.classList.add('active');
        btnPvP.classList.remove('active');
        nameODisplay.textContent = 'AI (O)';
        nameXDisplay.textContent = 'You (X)';
        diffRow.style.display = 'flex';
    } else {
        btnPvP.classList.add('active');
        btnPvAI.classList.remove('active');
        nameODisplay.textContent = 'Player O';
        nameXDisplay.textContent = 'Player X';
        diffRow.style.display = 'none';
    }
    resetScores();
}

// ── AI: Easy (random) ─────────────────────────────────────────────────────────
function easyMove() {
    const empty = gameBoard.reduce((acc, v, i) => v === '' ? [...acc, i] : acc, []);
    return empty[Math.floor(Math.random() * empty.length)];
}

// ── AI: Hard (minimax) ────────────────────────────────────────────────────────
function hardMove() {
    const empty = gameBoard.reduce((acc, v, i) => v === '' ? [...acc, i] : acc, []);

    // First move — play center or random corner for variety
    if (empty.length === 9) return 4;
    if (empty.length === 8) return gameBoard[4] === '' ? 4 : [0, 2, 6, 8][Math.floor(Math.random() * 4)];

    let best = -Infinity, move = -1;
    for (const i of empty) {
        gameBoard[i] = 'O';
        const s = minimax(gameBoard, 0, false, -Infinity, Infinity);
        gameBoard[i] = '';
        if (s > best) { best = s; move = i; }
    }
    return move;
}

function minimaxWinner(b) {
    for (const [a, bc, c] of WINNING_LINES) {
        if (b[a] && b[a] === b[bc] && b[a] === b[c]) return b[a];
    }
    if (!b.includes('')) return 'tie';
    return null;
}

function minimax(b, depth, isMax, alpha, beta) {
    const res = minimaxWinner(b);
    if (res === 'O') return 10 - depth;
    if (res === 'X') return depth - 10;
    if (res === 'tie') return 0;

    if (isMax) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === '') {
                b[i] = 'O';
                best = Math.max(best, minimax(b, depth + 1, false, alpha, beta));
                b[i] = '';
                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === '') {
                b[i] = 'X';
                best = Math.min(best, minimax(b, depth + 1, true, alpha, beta));
                b[i] = '';
                beta = Math.min(beta, best);
                if (beta <= alpha) break;
            }
        }
        return best;
    }
}

function makeAIMove() {
    if (!gameActive) return;
    const move = isHardAI ? hardMove() : easyMove();
    if (move !== undefined && move >= 0) {
        placeMove(move, 'O');
        unlockBoard();
    }
}

// ── Difficulty ────────────────────────────────────────────────────────────────
function setDifficulty(hard) {
    isHardAI = hard;
    diffHard.classList.toggle('active', hard);
    diffEasy.classList.toggle('active', !hard);
    restartGame();
}

// ── Event Listeners ───────────────────────────────────────────────────────────
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
btnRestart.addEventListener('click', restartGame);
btnResetScores.addEventListener('click', resetScores);
btnPlayAgain.addEventListener('click', restartGame);
btnPvP.addEventListener('click', () => setMode('pvp'));
btnPvAI.addEventListener('click', () => setMode('pvai'));
diffEasy.addEventListener('click', () => setDifficulty(false));
diffHard.addEventListener('click', () => setDifficulty(true));

// ── Init ──────────────────────────────────────────────────────────────────────
updateStatus();
