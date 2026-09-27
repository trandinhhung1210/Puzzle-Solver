let size = 3;
let boardState = [];
let isSolving = false;
let animationDelay = 150;

// UI Elements
const boardEl = document.getElementById('board');
const sizeSelect = document.getElementById('puzzle-size');
const displayModeSelect = document.getElementById('display-mode');
const imageUpload = document.getElementById('image-upload');
const heuristicSelect = document.getElementById('heuristic');
const speedInput = document.getElementById('speed');
const shuffleBtn = document.getElementById('btn-shuffle');
const customBtn = document.getElementById('btn-custom');
const hintBtn = document.getElementById('btn-hint');
const solveBtn = document.getElementById('btn-solve');
const statusEl = document.getElementById('status-message');
const timeEl = document.getElementById('metric-time');
const nodesEl = document.getElementById('metric-nodes');
const aiMovesEl = document.getElementById('metric-moves');
const playerTimeEl = document.getElementById('player-time');
const playerMovesEl = document.getElementById('player-moves');

// Player Manual State
let playTimerInterval = null;
let secondsElapsed = 0;
let manualMovesCount = 0;

// Image Mode State
let currentBgImage = 'url("https://images.unsplash.com/photo-1542451313056-b7c8e6266459?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80")';

// Playback State
let isPlayingSolution = false;
let solutionPath = [];
let currentStepIndex = 0;
let playbackTimeout = null;
const playbackControls = document.getElementById('playback-controls');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnStop = document.getElementById('btn-stop');

function initBoard() {
    size = parseInt(sizeSelect.value);
    boardState = [];
    for (let i = 1; i < size * size; i++) boardState.push(i);
    boardState.push(0);
    
    renderBoard();
    resetAIMetrics();
    stopTimer();
    secondsElapsed = 0;
    manualMovesCount = 0;
    updatePlayerStatsUI();
    
    statusEl.textContent = "Ready. Shuffle to begin!";
    statusEl.style.color = "var(--text-muted)";
}

function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.setProperty('--grid-size', size);
    
    boardState.forEach((tile, index) => {
        if (tile === 0) return;
        
        const row = Math.floor(index / size);
        const col = index % size;
        const targetRow = Math.floor((tile - 1) / size);
        const targetCol = (tile - 1) % size;
        
        const tileEl = document.createElement('div');
        tileEl.classList.add('tile');
        tileEl.textContent = tile;
        tileEl.id = `tile-${tile}`;
        
        // CSS Vars
        tileEl.style.setProperty('--col', col);
        tileEl.style.setProperty('--row', row);
        tileEl.style.setProperty('--target-row', targetRow);
        tileEl.style.setProperty('--target-col', targetCol);
        
        if (displayModeSelect.value === 'image') {
            tileEl.classList.add('image-mode');
            tileEl.style.setProperty('--bg-image', currentBgImage);
        }
        
        const gap = 8;
        tileEl.style.width = `calc((100% - ${gap * (size + 1)}px) / ${size})`;
        tileEl.style.height = `calc((100% - ${gap * (size + 1)}px) / ${size})`;
        tileEl.style.left = `calc(${gap}px + var(--col) * ((100% - ${gap}px) / ${size}))`;
        tileEl.style.top = `calc(${gap}px + var(--row) * ((100% - ${gap}px) / ${size}))`;
        
        tileEl.addEventListener('click', () => handleTileClick(tile));
        boardEl.appendChild(tileEl);
    });
}

function updateTilePositions(state) {
    const gap = 8;
    state.forEach((tile, index) => {
        if (tile === 0) return;
        const row = Math.floor(index / size);
        const col = index % size;
        const tileEl = document.getElementById(`tile-${tile}`);
        if (tileEl) {
            tileEl.style.setProperty('--col', col);
            tileEl.style.setProperty('--row', row);
            tileEl.style.left = `calc(${gap}px + var(--col) * ((100% - ${gap}px) / ${size}))`;
            tileEl.style.top = `calc(${gap}px + var(--row) * ((100% - ${gap}px) / ${size}))`;
        }
    });
}

function removeHints() {
    document.querySelectorAll('.tile').forEach(t => t.classList.remove('hinted'));
}

function handleTileClick(tile) {
    if (isSolving || document.getElementById('playback-controls').style.display !== 'none') return;
    removeHints();
    
    const tileIndex = boardState.indexOf(tile);
    const emptyIndex = boardState.indexOf(0);
    const tileRow = Math.floor(tileIndex / size);
    const tileCol = tileIndex % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;
    
    if (Math.abs(tileRow - emptyRow) + Math.abs(tileCol - emptyCol) === 1) {
        boardState[emptyIndex] = tile;
        boardState[tileIndex] = 0;
        updateTilePositions(boardState);
        
        manualMovesCount++;
        if (!playTimerInterval && !isSolved(boardState)) startTimer();
        updatePlayerStatsUI();
        
        checkWin();
    }
}

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (isSolving || document.getElementById('playback-controls').style.display !== 'none') return;
    
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"];
    if (keys.includes(e.key)) {
        e.preventDefault();
        const emptyIndex = boardState.indexOf(0);
        const emptyRow = Math.floor(emptyIndex / size);
        const emptyCol = emptyIndex % size;
        let tRow = emptyRow, tCol = emptyCol;
        
        const k = e.key.toLowerCase();
        if (k === 'arrowup' || k === 'w') tRow = emptyRow + 1;
        else if (k === 'arrowdown' || k === 's') tRow = emptyRow - 1;
        else if (k === 'arrowleft' || k === 'a') tCol = emptyCol + 1;
        else if (k === 'arrowright' || k === 'd') tCol = emptyCol - 1;
        
        if (tRow >= 0 && tRow < size && tCol >= 0 && tCol < size) {
            handleTileClick(boardState[tRow * size + tCol]);
        }
    }
});

// Timer Logic
function startTimer() {
    stopTimer();
    playTimerInterval = setInterval(() => {
        secondsElapsed++;
        updatePlayerStatsUI();
    }, 1000);
}

function stopTimer() {
    if (playTimerInterval) {
        clearInterval(playTimerInterval);
        playTimerInterval = null;
    }
}

function updatePlayerStatsUI() {
    const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const s = (secondsElapsed % 60).toString().padStart(2, '0');
    playerTimeEl.textContent = `${m}:${s}`;
    playerMovesEl.textContent = manualMovesCount;
}

function checkWin() {
    if (isSolved(boardState)) {
        stopTimer();
        statusEl.textContent = "🎉 Puzzle Solved! Congratulations!";
        statusEl.style.color = "var(--success)";
    } else {
        statusEl.textContent = "Playing...";
        statusEl.style.color = "var(--accent)";
    }
}

function resetAIMetrics() {
    timeEl.textContent = '-';
    nodesEl.textContent = '-';
    aiMovesEl.textContent = '-';
}

function shuffleBoard() {
    if (isSolving) return;
    removeHints();
    
    if (size === 3) {
        let state;
        do { state = [...boardState].sort(() => Math.random() - 0.5); } 
        while (!isSolvable(state, size) || isSolved(state));
        boardState = state;
    } else {
        let state = [...boardState].sort((a,b)=>a-b);
        let emptyIndex = 15;
        let lastEmpty = -1;
        for (let i = 0; i < 80; i++) {
            const row = Math.floor(emptyIndex / size);
            const col = emptyIndex % size;
            const valid = [];
            if (row > 0) valid.push(emptyIndex - size);
            if (row < size - 1) valid.push(emptyIndex + size);
            if (col > 0) valid.push(emptyIndex - 1);
            if (col < size - 1) valid.push(emptyIndex + 1);
            const possible = valid.filter(m => m !== lastEmpty);
            const next = possible.length > 0 ? possible[Math.floor(Math.random() * possible.length)] : valid[Math.floor(Math.random() * valid.length)];
            state[emptyIndex] = state[next];
            state[next] = 0;
            lastEmpty = emptyIndex;
            emptyIndex = next;
        }
        boardState = state;
    }
    
    updateTilePositions(boardState);
    resetAIMetrics();
    stopTimer();
    secondsElapsed = 0;
    manualMovesCount = 0;
    updatePlayerStatsUI();
    startTimer();
    statusEl.textContent = "Shuffled. Time started!";
    statusEl.style.color = "var(--accent)";
}

function isSolved(state) {
    for (let i = 0; i < state.length - 1; i++) {
        if (state[i] !== i + 1) return false;
    }
    return true;
}

function isSolvable(state, sz) {
    let inv = 0;
    const flat = state.filter(n => n !== 0);
    for (let i = 0; i < flat.length - 1; i++)
        for (let j = i + 1; j < flat.length; j++)
            if (flat[i] > flat[j]) inv++;
    if (sz % 2 !== 0) return inv % 2 === 0;
    const blankRowFromBottom = sz - Math.floor(state.indexOf(0) / sz);
    return (blankRowFromBottom % 2 === 0) ? (inv % 2 !== 0) : (inv % 2 === 0);
}

// Custom State
customBtn.addEventListener('click', () => {
    removeHints();
    const input = prompt(`Enter custom state (comma-separated, 0 is empty).\nExample 3x3: 1,2,3,4,5,6,7,8,0`, boardState.join(','));
    if (!input) return;
    
    const arr = input.split(',').map(n => parseInt(n.trim()));
    if (arr.length !== size * size || arr.some(isNaN)) {
        alert(`Error: Must provide exactly ${size * size} valid numbers.`); return;
    }
    
    const sorted = [...arr].sort((a,b) => a-b);
    for(let i=0; i<sorted.length; i++) {
        if (sorted[i] !== i) { alert(`Error: Numbers must be exactly 0 to ${size*size-1}.`); return; }
    }
    
    if (!isSolvable(arr, size) && !isSolved(arr)) {
        if (!confirm("Warning: This state is mathematically UNSOLVABLE. Play anyway?")) return;
    }
    
    boardState = arr;
    renderBoard();
    updateTilePositions(boardState);
    stopTimer();
    secondsElapsed = 0;
    manualMovesCount = 0;
    updatePlayerStatsUI();
    statusEl.textContent = "Custom state loaded!";
});

// Display Mode (Image)
displayModeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'image') {
        imageUpload.style.display = 'block';
        document.querySelectorAll('.tile').forEach(t => {
            t.classList.add('image-mode');
            t.style.setProperty('--bg-image', currentBgImage);
        });
    } else {
        imageUpload.style.display = 'none';
        document.querySelectorAll('.tile').forEach(t => t.classList.remove('image-mode'));
    }
});

imageUpload.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentBgImage = `url("${e.target.result}")`;
            document.querySelectorAll('.tile').forEach(t => t.style.setProperty('--bg-image', currentBgImage));
        }
        reader.readAsDataURL(e.target.files[0]);
    }
});

// A* Web Worker Integration
let worker;

function requestHint() {
    if (isSolving || isSolved(boardState)) return;
    removeHints();
    statusEl.textContent = "🧠 AI thinking for hint...";
    statusEl.style.color = "#8b5cf6";
    
    if (worker) worker.terminate();
    worker = new Worker('worker.js');
    worker.postMessage({ initialState: boardState, size: size, heuristicType: heuristicSelect.value });
    
    worker.onmessage = function(e) {
        const result = e.data;
        if (result.error) {
            statusEl.textContent = `Error: ${result.error}`;
            statusEl.style.color = "#ef4444";
        } else if (result.path && result.path.length > 1) {
            const nextState = result.path[1];
            const emptyNow = boardState.indexOf(0);
            const tileToMove = nextState[emptyNow];
            const tileEl = document.getElementById(`tile-${tileToMove}`);
            if (tileEl) tileEl.classList.add('hinted');
            statusEl.textContent = "💡 Hint: Move the flashing tile!";
            statusEl.style.color = "#8b5cf6";
        }
    };
}

function startSolving() {
    if (isSolving) return;
    if (isSolved(boardState)) {
        statusEl.textContent = "Already solved!"; return;
    }
    removeHints();
    stopTimer();
    isSolving = true;
    toggleMainControls(false);
    statusEl.textContent = "Computing optimal path... Please wait.";
    statusEl.style.color = "#fbbf24";
    
    if (worker) worker.terminate();
    worker = new Worker('worker.js');
    worker.postMessage({ initialState: boardState, size: size, heuristicType: heuristicSelect.value });
    
    worker.onmessage = function(e) {
        const result = e.data;
        if (result.error) {
            statusEl.textContent = `Error: ${result.error}`;
            statusEl.style.color = "#ef4444";
            isSolving = false;
            toggleMainControls(true);
        } else {
            timeEl.textContent = `${Math.round(result.time)} ms`;
            nodesEl.textContent = result.nodesExpanded.toLocaleString();
            aiMovesEl.textContent = result.path.length - 1;
            
            startSolutionPlayback(result.path);
        }
    };
}

// Playback Logic
function startSolutionPlayback(path) {
    solutionPath = path;
    currentStepIndex = 0;
    isPlayingSolution = false;
    
    document.getElementById('speed-control').style.display = 'flex';
    playbackControls.style.display = 'block';
    document.getElementById('total-steps').textContent = path.length - 1;
    updatePlaybackUI();
    
    togglePlayPause(); // Auto start
}

function updatePlaybackUI() {
    document.getElementById('step-counter').textContent = currentStepIndex;
    boardState = solutionPath[currentStepIndex];
    updateTilePositions(boardState);
    
    if (currentStepIndex === solutionPath.length - 1) {
        statusEl.textContent = "✅ Solved by A*!";
        statusEl.style.color = "var(--success)";
        if (isPlayingSolution) togglePlayPause(); // Auto stop at end
    } else {
        statusEl.textContent = "📺 Viewing Solution...";
        statusEl.style.color = "var(--accent)";
    }
}

function togglePlayPause() {
    isPlayingSolution = !isPlayingSolution;
    if (isPlayingSolution) {
        if (currentStepIndex === solutionPath.length - 1) currentStepIndex = 0; // Restart if at end
        btnPlayPause.innerHTML = "⏸ Pause";
        playNextStepLoop();
    } else {
        btnPlayPause.innerHTML = "▶️ Play";
        if (playbackTimeout) clearTimeout(playbackTimeout);
    }
}

function playNextStepLoop() {
    if (!isPlayingSolution) return;
    if (currentStepIndex < solutionPath.length - 1) {
        currentStepIndex++;
        updatePlaybackUI();
        playbackTimeout = setTimeout(playNextStepLoop, animationDelay);
    } else {
        togglePlayPause(); // Stop
    }
}

btnPlayPause.addEventListener('click', togglePlayPause);
btnPrev.addEventListener('click', () => { if (currentStepIndex > 0) { currentStepIndex--; updatePlaybackUI(); }});
btnNext.addEventListener('click', () => { if (currentStepIndex < solutionPath.length - 1) { currentStepIndex++; updatePlaybackUI(); }});
btnStop.addEventListener('click', () => {
    isPlayingSolution = false;
    if (playbackTimeout) clearTimeout(playbackTimeout);
    playbackControls.style.display = 'none';
    document.getElementById('speed-control').style.display = 'none';
    isSolving = false;
    toggleMainControls(true);
    statusEl.textContent = "Playback stopped. You can play from here.";
});

function toggleMainControls(enabled) {
    shuffleBtn.disabled = !enabled;
    solveBtn.disabled = !enabled;
    hintBtn.disabled = !enabled;
    customBtn.disabled = !enabled;
    sizeSelect.disabled = !enabled;
}

// Event Listeners
sizeSelect.addEventListener('change', initBoard);
speedInput.addEventListener('input', (e) => animationDelay = e.target.value);
shuffleBtn.addEventListener('click', shuffleBoard);
hintBtn.addEventListener('click', requestHint);
solveBtn.addEventListener('click', startSolving);

// Init
initBoard();
