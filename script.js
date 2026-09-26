let size = 3;
let boardState = [];
let isSolving = false;
let animationDelay = 150; // ms

const boardEl = document.getElementById('board');
const sizeSelect = document.getElementById('puzzle-size');
const heuristicSelect = document.getElementById('heuristic');
const speedInput = document.getElementById('speed');
const shuffleBtn = document.getElementById('btn-shuffle');
const solveBtn = document.getElementById('btn-solve');
const statusEl = document.getElementById('status-message');
const timeEl = document.getElementById('metric-time');
const nodesEl = document.getElementById('metric-nodes');
const movesEl = document.getElementById('metric-moves');

function initBoard() {
    size = parseInt(sizeSelect.value);
    
    // Generate solved state
    boardState = [];
    for (let i = 1; i < size * size; i++) {
        boardState.push(i);
    }
    boardState.push(0); // 0 is empty tile
    
    renderBoard();
    resetMetrics();
    statusEl.textContent = "Ready. Shuffle to begin.";
    statusEl.style.color = "var(--text-muted)";
}

function renderBoard() {
    boardEl.innerHTML = '';
    boardState.forEach((tile, index) => {
        if (tile === 0) return; // Empty tile doesn't get a DOM element
        
        const row = Math.floor(index / size);
        const col = index % size;
        
        const tileEl = document.createElement('div');
        tileEl.classList.add('tile');
        tileEl.textContent = tile;
        tileEl.id = `tile-${tile}`;
        
        // CSS var calculations for position
        tileEl.style.setProperty('--col', col);
        tileEl.style.setProperty('--row', row);
        
        const gap = 8;
        const totalGap = gap * (size + 1);
        
        tileEl.style.width = `calc((100% - ${totalGap}px) / ${size})`;
        tileEl.style.height = `calc((100% - ${totalGap}px) / ${size})`;
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

function handleTileClick(tile) {
    if (isSolving) return;
    
    const tileIndex = boardState.indexOf(tile);
    const emptyIndex = boardState.indexOf(0);
    
    const tileRow = Math.floor(tileIndex / size);
    const tileCol = tileIndex % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;
    
    // Check if adjacent
    const isAdjacent = Math.abs(tileRow - emptyRow) + Math.abs(tileCol - emptyCol) === 1;
    
    if (isAdjacent) {
        // Swap in state
        boardState[emptyIndex] = tile;
        boardState[tileIndex] = 0;
        updateTilePositions(boardState);
        checkWin();
    }
}

function checkWin() {
    if (isSolved(boardState)) {
        statusEl.textContent = "Puzzle Solved!";
        statusEl.style.color = "var(--success)";
    } else {
        statusEl.textContent = "Playing...";
        statusEl.style.color = "var(--accent)";
    }
}

function resetMetrics() {
    timeEl.textContent = '-';
    nodesEl.textContent = '-';
    movesEl.textContent = '-';
}

function shuffleBoard() {
    if (isSolving) return;
    
    if (size === 3) {
        // Standard random for 3x3 ensuring solvability
        let state;
        do {
            state = [...boardState].sort(() => Math.random() - 0.5);
        } while (!isSolvable(state, size) || isSolved(state));
        boardState = state;
    } else {
        // For 4x4, random walk to keep the generated state easily solvable for A* (prevents freezing)
        let state = [...boardState];
        // Ensure starting from solved state for random walk
        for (let i=0; i<15; i++) state[i] = i+1;
        state[15] = 0;

        let emptyIndex = 15;
        let movesCount = 80;
        let lastEmpty = -1;
        
        for (let i = 0; i < movesCount; i++) {
            const row = Math.floor(emptyIndex / size);
            const col = emptyIndex % size;
            const validMoves = [];
            
            if (row > 0) validMoves.push(emptyIndex - size);
            if (row < size - 1) validMoves.push(emptyIndex + size);
            if (col > 0) validMoves.push(emptyIndex - 1);
            if (col < size - 1) validMoves.push(emptyIndex + 1);
            
            const possibleMoves = validMoves.filter(m => m !== lastEmpty);
            const nextEmpty = possibleMoves.length > 0 ? possibleMoves[Math.floor(Math.random() * possibleMoves.length)] : validMoves[Math.floor(Math.random() * validMoves.length)];
            
            state[emptyIndex] = state[nextEmpty];
            state[nextEmpty] = 0;
            
            lastEmpty = emptyIndex;
            emptyIndex = nextEmpty;
        }
        boardState = state;
    }
    
    updateTilePositions(boardState);
    resetMetrics();
    statusEl.textContent = "Shuffled. Ready to solve.";
    statusEl.style.color = "var(--accent)";
}

function isSolved(state) {
    for (let i = 0; i < state.length - 1; i++) {
        if (state[i] !== i + 1) return false;
    }
    return true;
}

function isSolvable(state, size) {
    let inversions = 0;
    const flatState = state.filter(n => n !== 0);
    for (let i = 0; i < flatState.length - 1; i++) {
        for (let j = i + 1; j < flatState.length; j++) {
            if (flatState[i] > flatState[j]) {
                inversions++;
            }
        }
    }

    if (size % 2 !== 0) {
        return inversions % 2 === 0;
    } else {
        const blankIndex = state.indexOf(0);
        const blankRowFromBottom = size - Math.floor(blankIndex / size);
        if (blankRowFromBottom % 2 === 0) {
            return inversions % 2 !== 0;
        } else {
            return inversions % 2 === 0;
        }
    }
}

// Web Worker for A* processing
let worker;

function startSolving() {
    if (isSolving) return;
    if (isSolved(boardState)) {
        statusEl.textContent = "Already solved!";
        statusEl.style.color = "var(--success)";
        return;
    }
    
    isSolving = true;
    toggleControls(false);
    statusEl.textContent = "Computing optimal path... Please wait.";
    statusEl.style.color = "#fbbf24";
    
    if (worker) worker.terminate();
    worker = new Worker('worker.js');
    
    worker.postMessage({
        initialState: boardState,
        size: size,
        heuristicType: heuristicSelect.value
    });
    
    worker.onmessage = function(e) {
        const result = e.data;
        if (result.error) {
            statusEl.textContent = `Error: ${result.error}`;
            statusEl.style.color = "#ef4444";
            isSolving = false;
            toggleControls(true);
        } else {
            timeEl.textContent = `${Math.round(result.time)} ms`;
            nodesEl.textContent = result.nodesExpanded.toLocaleString();
            movesEl.textContent = result.path.length - 1;
            
            animateSolution(result.path);
        }
    };
}

async function animateSolution(path) {
    statusEl.textContent = "Animating solution...";
    statusEl.style.color = "var(--accent)";
    
    for (let i = 1; i < path.length; i++) {
        boardState = path[i];
        updateTilePositions(boardState);
        await new Promise(resolve => setTimeout(resolve, animationDelay));
    }
    
    statusEl.textContent = "Solved by A*!";
    statusEl.style.color = "var(--success)";
    isSolving = false;
    toggleControls(true);
}

function toggleControls(enabled) {
    shuffleBtn.disabled = !enabled;
    solveBtn.disabled = !enabled;
    sizeSelect.disabled = !enabled;
    heuristicSelect.disabled = !enabled;
}

// Event Listeners
sizeSelect.addEventListener('change', initBoard);
speedInput.addEventListener('input', (e) => {
    animationDelay = e.target.value;
});
shuffleBtn.addEventListener('click', shuffleBoard);
solveBtn.addEventListener('click', startSolving);

// Initialization
initBoard();
