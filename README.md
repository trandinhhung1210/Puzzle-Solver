# 🧩 A* Puzzle Solver Pro (8-Puzzle & 15-Puzzle)

An interactive, modern web application for solving the classic 8-Puzzle and 15-Puzzle sliding games using the **A\* (A-Star)** search algorithm.

## 🚀 Live Demo
Play online directly via GitHub Pages:  
👉 **[https://trandinhhung1210.github.io/Puzzle-Solver/](https://trandinhhung1210.github.io/Puzzle-Solver/)**

## ✨ Features
- **3x3 (8-Puzzle) & 4x4 (15-Puzzle)**: Switch seamlessly between board sizes.
- **AI Solver (A\* Search Algorithm)**:
  - Priority Queue (Min-Heap) implementation.
  - Multi-threaded via **Web Workers** (smooth UI, no freezing).
  - Heuristics: **Manhattan Distance** & **Misplaced Tiles**.
- **Playback Controller**: Pause, resume, step forward, or step backward through the AI's solution.
- **Gamification & Manual Play**:
  - Live timer & move counter.
  - **💡 Hint Button**: Highlights the optimal next move.
- **Image Puzzle Mode**: Play with an image sliced into tiles, with support for custom image uploads!
- **Keyboard Controls**: Move tiles with Arrow keys (`↑ ↓ ← →`) or `W`, `A`, `S`, `D`.
- **Custom Initial State**: Input any initial board configuration with automated parity & solvability verification.
- **Python Implementation**: Standalone CLI solver in `solver.py`.

## 🛠️ Tech Stack
- Frontend: HTML5, CSS3 (Modern Dark Theme), JavaScript (ES6+), Web Workers
- Algorithm: A\* Search, Min-Heap Priority Queue
- Python: Standalone terminal solver with `heapq`
