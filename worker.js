// Priority Queue Implementation (Min-Heap)
class PriorityQueue {
    constructor(comparator = (a, b) => a.f - b.f) {
        this._heap = [];
        this._comparator = comparator;
    }
    size() { return this._heap.length; }
    isEmpty() { return this.size() === 0; }
    peek() { return this._heap[0]; }
    push(value) {
        this._heap.push(value);
        this._siftUp();
        return this.size();
    }
    pop() {
        const poppedValue = this.peek();
        const bottom = this.size() - 1;
        if (bottom > 0) {
            this._swap(0, bottom);
        }
        this._heap.pop();
        this._siftDown();
        return poppedValue;
    }
    _parent(i) { return ((i + 1) >>> 1) - 1; }
    _left(i) { return (i << 1) + 1; }
    _right(i) { return (i + 1) << 1; }
    _swap(i, j) {
        const temp = this._heap[i];
        this._heap[i] = this._heap[j];
        this._heap[j] = temp;
    }
    _siftUp() {
        let node = this.size() - 1;
        while (node > 0 && this._comparator(this._heap[node], this._heap[this._parent(node)]) < 0) {
            this._swap(node, this._parent(node));
            node = this._parent(node);
        }
    }
    _siftDown() {
        let node = 0;
        while (
            (this._left(node) < this.size() && this._comparator(this._heap[this._left(node)], this._heap[node]) < 0) ||
            (this._right(node) < this.size() && this._comparator(this._heap[this._right(node)], this._heap[node]) < 0)
        ) {
            let maxChild = (this._right(node) < this.size() && this._comparator(this._heap[this._right(node)], this._heap[this._left(node)]) < 0) ? this._right(node) : this._left(node);
            this._swap(node, maxChild);
            node = maxChild;
        }
    }
}

// A* Solver class
class PuzzleSolver {
    constructor(initialState, size, heuristicType) {
        this.initialState = initialState;
        this.size = size;
        this.heuristicType = heuristicType;
        
        // Generate goal state
        this.goalState = [];
        for (let i = 1; i < size * size; i++) {
            this.goalState.push(i);
        }
        this.goalState.push(0);
        this.goalStr = this.goalState.toString();
        
        // Pre-compute goal positions for Manhattan heuristic speedup
        this.goalPos = [];
        for (let i = 1; i < size * size; i++) {
            this.goalPos[i] = { r: Math.floor((i-1)/size), c: (i-1)%size };
        }
    }

    getHeuristic(state) {
        let h = 0;
        for (let i = 0; i < state.length; i++) {
            const val = state[i];
            if (val === 0) continue;
            
            if (this.heuristicType === 'manhattan') {
                const r = Math.floor(i / this.size);
                const c = i % this.size;
                const target = this.goalPos[val];
                h += Math.abs(r - target.r) + Math.abs(c - target.c);
            } else {
                // Misplaced tiles
                if (val !== i + 1) h++;
            }
        }
        return h;
    }

    getNeighbors(state) {
        const neighbors = [];
        const blankIndex = state.indexOf(0);
        const row = Math.floor(blankIndex / this.size);
        const col = blankIndex % this.size;

        if (row > 0) { // Up
            const newIdx = blankIndex - this.size;
            const newState = state.slice();
            newState[blankIndex] = newState[newIdx];
            newState[newIdx] = 0;
            neighbors.push(newState);
        }
        if (row < this.size - 1) { // Down
            const newIdx = blankIndex + this.size;
            const newState = state.slice();
            newState[blankIndex] = newState[newIdx];
            newState[newIdx] = 0;
            neighbors.push(newState);
        }
        if (col > 0) { // Left
            const newIdx = blankIndex - 1;
            const newState = state.slice();
            newState[blankIndex] = newState[newIdx];
            newState[newIdx] = 0;
            neighbors.push(newState);
        }
        if (col < this.size - 1) { // Right
            const newIdx = blankIndex + 1;
            const newState = state.slice();
            newState[blankIndex] = newState[newIdx];
            newState[newIdx] = 0;
            neighbors.push(newState);
        }
        
        return neighbors;
    }

    solve() {
        const startTime = performance.now();
        
        // A* Tie-breaking: prefer higher g-costs when f-costs are equal to go deeper and find goals faster
        const openSet = new PriorityQueue((a, b) => {
            if (a.f === b.f) return b.g - a.g; 
            return a.f - b.f;
        });
        
        const startNode = {
            state: this.initialState,
            g: 0,
            h: this.getHeuristic(this.initialState),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);
        
        const closedSet = new Set();
        let nodesExpanded = 0;
        
        while (!openSet.isEmpty()) {
            const current = openSet.pop();
            const currentStr = current.state.toString();

            if (currentStr === this.goalStr) {
                return {
                    path: this.reconstructPath(current),
                    nodesExpanded: nodesExpanded,
                    time: performance.now() - startTime
                };
            }

            if (closedSet.has(currentStr)) continue;
            closedSet.add(currentStr);
            nodesExpanded++;

            const neighbors = this.getNeighbors(current.state);
            for (let i = 0; i < neighbors.length; i++) {
                const neighborState = neighbors[i];
                if (closedSet.has(neighborState.toString())) continue;

                const g = current.g + 1;
                const h = this.getHeuristic(neighborState);
                
                openSet.push({
                    state: neighborState,
                    g: g,
                    h: h,
                    f: g + h,
                    parent: current
                });
            }
            
            // Limit expansion to prevent memory crash on very hard 15-puzzle instances
            if (nodesExpanded > 2000000) {
                 return { path: null, nodesExpanded: nodesExpanded, time: performance.now() - startTime, error: 'Search limit exceeded (Puzzle too complex for basic A*).' };
            }
        }

        return { path: null, nodesExpanded: nodesExpanded, time: performance.now() - startTime, error: 'No solution found.' };
    }

    reconstructPath(node) {
        const path = [];
        let current = node;
        while (current !== null) {
            path.push(current.state);
            current = current.parent;
        }
        return path.reverse();
    }
}

// Web Worker message listener
self.onmessage = function(e) {
    const { initialState, size, heuristicType } = e.data;
    const solver = new PuzzleSolver(initialState, size, heuristicType);
    const result = solver.solve();
    self.postMessage(result);
};
