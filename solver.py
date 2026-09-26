import heapq
import time
import random
import sys

# Fix cho lỗi in tiếng Việt trên màn hình console (Windows)
sys.stdout.reconfigure(encoding='utf-8')

class Node:
    def __init__(self, state, g, h, parent):
        self.state = state
        self.g = g
        self.h = h
        self.f = g + h
        self.parent = parent

    def __lt__(self, other):
        # Tie-breaker: prefer higher g-costs (deeper paths) khi f-costs bằng nhau
        if self.f == other.f:
            return self.g > other.g
        return self.f < other.f

class PuzzleSolver:
    def __init__(self, initial_state, size, heuristic_type='manhattan'):
        self.initial_state = tuple(initial_state)
        self.size = size
        self.heuristic_type = heuristic_type
        
        # Generate trạng thái đích: (1, 2, ..., size*size-1, 0)
        self.goal_state = tuple(list(range(1, size * size)) + [0])
        
        # Tính toán trước vị trí đích của các ô cho heuristic Manhattan
        self.goal_pos = {}
        for i in range(1, size * size):
            self.goal_pos[i] = ((i-1) // size, (i-1) % size)
            
    def get_heuristic(self, state):
        h = 0
        for i, val in enumerate(state):
            if val == 0:
                continue
            if self.heuristic_type == 'manhattan':
                r, c = i // self.size, i % self.size
                tr, tc = self.goal_pos[val]
                h += abs(r - tr) + abs(c - tc)
            else:
                # misplaced tiles (số ô sai vị trí)
                if val != i + 1:
                    h += 1
        return h

    def get_neighbors(self, state):
        neighbors = []
        blank_idx = state.index(0)
        row = blank_idx // self.size
        col = blank_idx % self.size

        moves = []
        if row > 0: moves.append(blank_idx - self.size) # Lên
        if row < self.size - 1: moves.append(blank_idx + self.size) # Xuống
        if col > 0: moves.append(blank_idx - 1) # Trái
        if col < self.size - 1: moves.append(blank_idx + 1) # Phải
        
        for new_idx in moves:
            new_state = list(state)
            # Swap ô trống và ô kề
            new_state[blank_idx], new_state[new_idx] = new_state[new_idx], new_state[blank_idx]
            neighbors.append(tuple(new_state))
            
        return neighbors

    def solve(self):
        start_time = time.time()
        
        start_node = Node(self.initial_state, 0, self.get_heuristic(self.initial_state), None)
        open_set = []
        heapq.heappush(open_set, start_node)
        
        closed_set = set()
        nodes_expanded = 0
        
        while open_set:
            current = heapq.heappop(open_set)
            
            if current.state == self.goal_state:
                end_time = time.time()
                path = self.reconstruct_path(current)
                return {
                    'path': path,
                    'nodes_expanded': nodes_expanded,
                    'time_ms': (end_time - start_time) * 1000
                }
                
            if current.state in closed_set:
                continue
                
            closed_set.add(current.state)
            nodes_expanded += 1
            
            for neighbor_state in self.get_neighbors(current.state):
                if neighbor_state in closed_set:
                    continue
                    
                g = current.g + 1
                h = self.get_heuristic(neighbor_state)
                neighbor_node = Node(neighbor_state, g, h, current)
                heapq.heappush(open_set, neighbor_node)
                
            # Cắt nhánh nếu tìm quá lâu để tránh tràn RAM
            if nodes_expanded > 500000:
                return {'error': 'Vượt quá giới hạn tìm kiếm.'}
                
        return {'error': 'Không tìm thấy giải pháp.'}

    def reconstruct_path(self, node):
        path = []
        current = node
        while current:
            path.append(current.state)
            current = current.parent
        path.reverse()
        return path


def is_solvable(state, size):
    inversions = 0
    flat_state = [x for x in state if x != 0]
    for i in range(len(flat_state) - 1):
        for j in range(i + 1, len(flat_state)):
            if flat_state[i] > flat_state[j]:
                inversions += 1
                
    if size % 2 != 0:
        return inversions % 2 == 0
    else:
        blank_idx = state.index(0)
        blank_row_from_bottom = size - (blank_idx // size)
        if blank_row_from_bottom % 2 == 0:
            return inversions % 2 != 0
        else:
            return inversions % 2 == 0

def generate_random_solvable_state(size):
    # Đi lùi từ trạng thái đích bằng các bước hợp lệ 
    # (Đảm bảo 100% có thể giải được)
    state = list(range(1, size * size)) + [0]
    blank_idx = size * size - 1
    
    num_shuffles = 40 if size == 3 else 80
    last_blank = -1
    
    for _ in range(num_shuffles):
        row = blank_idx // size
        col = blank_idx % size
        valid_moves = []
        
        if row > 0: valid_moves.append(blank_idx - size)
        if row < size - 1: valid_moves.append(blank_idx + size)
        if col > 0: valid_moves.append(blank_idx - 1)
        if col < size - 1: valid_moves.append(blank_idx + 1)
        
        possible_moves = [m for m in valid_moves if m != last_blank]
        if not possible_moves:
            possible_moves = valid_moves
            
        next_blank = random.choice(possible_moves)
        state[blank_idx], state[next_blank] = state[next_blank], state[blank_idx]
        
        last_blank = blank_idx
        blank_idx = next_blank
        
    return state

def print_board(state, size):
    for i in range(size):
        row = state[i*size:(i+1)*size]
        print(" ".join(f"{str(x).rjust(2, ' ') if x != 0 else '  '}" for x in row))
    print()

def main():
    size = 3 # Thay đổi thành 4 nếu muốn giải 15-puzzle (4x4)
    print(f"--- Thuật toán A* giải {size*size - 1}-Puzzle ---")
    
    initial_state = generate_random_solvable_state(size)
    print("Trạng thái ban đầu:")
    print_board(initial_state, size)
    
    # Bạn có thể đổi heuristic_type thành 'misplaced'
    solver = PuzzleSolver(initial_state, size, heuristic_type='manhattan')
    
    print("Đang giải bằng Heuristic Manhattan...")
    result = solver.solve()
    
    if 'error' in result:
        print(f"Thất bại: {result['error']}")
    else:
        print(f"Đã tìm thấy giải pháp!")
        print(f"Tổng số bước đi: {len(result['path']) - 1}")
        print(f"Số lượng Node đã mở rộng (Nodes Expanded): {result['nodes_expanded']}")
        print(f"Thời gian chạy: {result['time_ms']:.2f} ms\n")
        
        # Bỏ comment đoạn dưới nếu muốn in ra từng bước di chuyển của thuật toán
        # print("Các bước đi:")
        # for i, step in enumerate(result['path']):
        #     print(f"Bước {i}:")
        #     print_board(step, size)

if __name__ == "__main__":
    main()
