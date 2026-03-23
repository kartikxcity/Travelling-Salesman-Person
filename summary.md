# Project Summary

## 1. Overview

This project is a full-stack **Traveling Salesman Problem (TSP) benchmarking lab**. It allows users to generate or enter city coordinates, run multiple TSP algorithms, and compare their results using tables, charts, and route visualization.

### What problem it solves
- TSP is computationally hard (NP-hard), and different algorithms trade off between speed and optimality.
- The project helps users **understand these trade-offs in practice** by running the same input through multiple algorithms.
- It also demonstrates how to combine a web UI, a Node.js API layer, and high-performance C++ computation.

### Key features
- Four TSP approaches in one app:
  - Brute Force
  - Nearest Neighbor
  - Held-Karp (Dynamic Programming)
  - Branch and Bound
- Two execution modes:
  - Browser-side JavaScript execution
  - Backend API execution with C++ engine
- Route visualization on a canvas
- Benchmark table for cost/time
- Performance charts (time, cost, scalability)
- Custom coordinate input and random city generation

---

## 2. Project Structure

### Overall folder structure
- `frontend/`: user interface and client-side algorithm mode
- `backend/`: API server, JavaScript fallback algorithm engine, C++ runner, and C++ algorithm sources
- `README.md`: setup and usage instructions
- `LICENSE`: project license file

### Frontend folder
- `index.html`: UI layout and element wiring targets
- `style.css`: visual design, responsive behavior, and chart/card styling
- `script.js`: all client-side logic (state, algorithms, API calls, rendering)

### Backend folder
- `server.js`: Express API + static frontend serving + JS algorithm fallback + C++ process orchestration
- `package.json`: dependencies and run scripts
- `cpp_runner.cpp`: standalone C++ executable that reads city input, runs all algorithms, returns JSON
- `main.cpp`: older standalone C++ demo writing benchmark output to a file
- `tsp/*.h` + `tsp/*.cpp`: individual C++ algorithm implementations
- `utils/timer.h`: basic C++ timer utility

---

## 3. Frontend Documentation

### File: `frontend/index.html`

**Purpose**
- Defines the complete dashboard UI for input, execution controls, canvas visualization, result table, charts, and insights.

**Components/modules used**
- Control inputs:
  - `#cityCount`
  - `#executionMode`
  - `#algorithmSelect`
  - `#showRoute`
  - `#customCoords`
- Action buttons:
  - `#generateBtn`
  - `#runBtn`
  - `#scalabilityBtn`
  - `#applyCustomBtn`
- Outputs:
  - `#cityCanvas`
  - `#resultsBody`
  - `#insightsList`
  - `#timeChart`, `#costChart`, `#scalabilityChart`
- External library:
  - Chart.js CDN for charts

**Key logic (simple explanation)**
- HTML acts as a template and hook-point for JavaScript.
- Every dynamic behavior (running algorithms, drawing routes, updating charts) is driven by IDs that `script.js` references.

**State management / API usage**
- No state logic in HTML itself.
- API and state are handled in `script.js`.

---

### File: `frontend/style.css`

**Purpose**
- Defines a neon-terminal visual style, spacing, responsive layout, and card/chart/table appearance.

**Components/modules used**
- CSS custom properties (`:root` variables) for theme consistency
- Grid layouts for dashboard sections and chart cards
- Responsive media query for mobile/tablet
- Animation (`panel-rise`) for panel entry

**Key logic (simple explanation)**
- Uses reusable variables for colors/shadows.
- Builds visual hierarchy with panel containers and typography.
- Ensures chart cards and controls adapt to smaller screens.

**State management / API usage**
- No JS state or API calls in CSS.

---

### File: `frontend/script.js`

**Purpose**
- Main client controller: input handling, city generation, matrix building, algorithm execution (browser mode), API calls (backend mode), drawing, table/charts rendering, and insights generation.

**Components/modules used**
- In-memory app state object:
  - `cities`, `dist`, `results`, `scalability`, `charts`
- Canvas API for route visualization
- Chart.js for metrics visualization
- `fetch()` for backend API communication

**Key logic (simple explanation)**
- Builds Euclidean distance matrix from city coordinates.
- Contains JavaScript implementations of all 4 TSP algorithms.
- Supports two execution paths:
  - Browser mode: run JS algorithms directly
  - API mode: POST cities to backend and consume results
- Renders:
  - benchmark result table
  - bar charts for time/cost
  - line chart for scalability
  - route path overlay for selected algorithm
- Computes simple insight statements (fastest algorithm, best cost, nearest-vs-optimal gap).

**State management / API usage**
- Centralized mutable `state` object (lightweight local state management).
- API endpoint used:
  - `POST /api/run` with `{ cities, engine: "cpp" }`
- Error handling:
  - checks response status
  - displays fallback status messages in UI

---

## 4. Backend Documentation

### File: `backend/package.json`

**Purpose**
- Defines Node.js package metadata, dependencies, and scripts.

**Routes/APIs defined**
- Not applicable (configuration file).

**Business logic**
- Provides scripts for:
  - `start`: runs server
  - `compile:cpp`: compiles `cpp_runner.cpp` into `build/tsp_runner.exe`
  - `start:cpp`: compile then run server with `TSP_ENGINE=cpp`

**Database interaction**
- None.

---

### File: `backend/server.js`

**Purpose**
- Core backend service. Serves static frontend files and exposes API endpoints for TSP execution and scalability benchmarks.

**Routes/APIs defined**
- `GET /api/health`
  - returns health status and whether C++ executable exists
- `POST /api/run`
  - input: city list and optional engine mode
  - output: per-algorithm benchmark results
- `POST /api/scalability`
  - input: min/max city counts
  - output: time-series benchmark data per algorithm

**Business logic**
- Includes JavaScript implementations of all four algorithms as fallback engine.
- Builds distance matrix from coordinate input.
- Chooses runtime mode:
  - C++ (`runWithCpp`) by default
  - JS (`runInJs`) when requested
- Spawns C++ executable process, writes city input via stdin, parses stdout JSON.
- Provides basic platform-specific browser auto-open logic on server start.

**Database interaction**
- None.

---

### File: `backend/cpp_runner.cpp`

**Purpose**
- Production C++ runner executable used by backend API for high-performance algorithm computation.

**Routes/APIs defined**
- Not an HTTP API; acts as a CLI process that communicates using stdin/stdout.

**Business logic**
- Reads:
  - first line: `n` (city count)
  - next `n` lines: `x y` coordinates
- Builds integer distance matrix using Euclidean distance.
- Runs 4 algorithms with timing wrappers.
- Applies safety skip thresholds:
  - Brute Force skipped when `n > 10`
  - Branch and Bound skipped when `n > 11`
- Emits structured JSON for backend response.

**Database interaction**
- None.

---

### File: `backend/main.cpp`

**Purpose**
- Legacy/demo C++ runner that benchmarks using a hardcoded 4-city matrix and writes JSON-like output to file.

**Routes/APIs defined**
- None.

**Business logic**
- Loads static matrix, runs all algorithms, records timing via `Timer`, writes results.

**Database interaction**
- None.

---

### File: `backend/utils/timer.h`

**Purpose**
- Small utility class for measuring elapsed execution time in milliseconds.

**Routes/APIs defined**
- None.

**Business logic**
- `startTimer()` captures start time.
- `stopTimer()` returns elapsed milliseconds.

**Database interaction**
- None.

---

### File: `backend/tsp/bruteforce.h`

**Purpose**
- Declares brute-force TSP function signature.

**Routes/APIs defined**
- None.

**Business logic**
- Interface declaration only.

**Database interaction**
- None.

---

### File: `backend/tsp/bruteforce.cpp`

**Purpose**
- Implements exact brute-force TSP by checking all permutations.

**Routes/APIs defined**
- None.

**Business logic**
- Permutes all cities except source city (0).
- Computes full cycle cost and returns minimum.
- Time complexity is factorial (`O(n!)`), accurate but slow.

**Database interaction**
- None.

---

### File: `backend/tsp/nearest.h`

**Purpose**
- Declares nearest-neighbor TSP function signature.

**Routes/APIs defined**
- None.

**Business logic**
- Interface declaration only.

**Database interaction**
- None.

---

### File: `backend/tsp/nearest.cpp`

**Purpose**
- Implements nearest-neighbor heuristic for fast approximate TSP.

**Routes/APIs defined**
- None.

**Business logic**
- Starts at city 0.
- Repeatedly picks the nearest unvisited city.
- Returns to start at end.
- Fast (`O(n^2)`), but not always optimal.

**Database interaction**
- None.

---

### File: `backend/tsp/heldkarp.h`

**Purpose**
- Declares Held-Karp dynamic programming function signature.

**Routes/APIs defined**
- None.

**Business logic**
- Interface declaration only.

**Database interaction**
- None.

---

### File: `backend/tsp/heldkarp.cpp`

**Purpose**
- Implements exact Held-Karp TSP using bitmask DP.

**Routes/APIs defined**
- None.

**Business logic**
- DP state: `dp[mask][u]` = best cost to reach city `u` with visited set `mask`.
- Transitions by adding unvisited city.
- Final answer closes tour back to city 0.
- Exact algorithm with complexity around `O(n^2 * 2^n)`.

**Database interaction**
- None.

---

### File: `backend/tsp/branchbound.h`

**Purpose**
- Declares branch-and-bound TSP function signature.

**Routes/APIs defined**
- None.

**Business logic**
- Interface declaration only.

**Database interaction**
- None.

---

### File: `backend/tsp/branchbound.cpp`

**Purpose**
- Implements DFS-based branch-and-bound style exact search.

**Routes/APIs defined**
- None.

**Business logic**
- Recursively explores permutations from city 0.
- Tracks best global result and prunes through recursion structure.
- In this version, pruning is limited (no strong lower-bound heuristic), so growth is still exponential in worst case.

**Database interaction**
- None.

---

## 5. Module & Component Breakdown

### Important frontend modules/components
- Input controls module (city count, execution mode, custom coordinates)
- Execution module (`runBenchmarks`, `runScalability`)
- Visualization module (`drawScene`, chart renderers)
- Results module (`renderResultsTable`, `renderInsights`)
- Local algorithm engine module (all 4 JS algorithms)

### Important backend modules/components
- API gateway module (`server.js` routes)
- JS fallback compute engine (inside `server.js`)
- C++ process bridge (`runWithCpp` in `server.js`)
- C++ compute engine (`cpp_runner.cpp`)
- Legacy C++ algorithm library (`backend/tsp/*.cpp`)

### How they interact
1. User triggers actions in frontend controls.
2. Frontend either computes locally or calls backend API.
3. Backend may execute JS algorithms or call C++ executable.
4. Results return as JSON to frontend.
5. Frontend updates table, insights, charts, and route canvas.

---

## 6. Data Flow

### Step-by-step flow (frontend -> backend -> compute layer -> frontend)

1. User input is collected (city count or custom coordinates).
2. Frontend builds city list and distance matrix for local rendering.
3. On Run:
   - Browser mode: frontend runs local JS algorithms directly.
   - API mode: frontend sends city list to `POST /api/run`.
4. Backend validates request payload (`cities` array with at least 4 points).
5. Backend chooses engine:
   - C++: spawn `tsp_runner.exe`, stream input, parse JSON output.
   - JS: run internal JS implementations.
6. Backend returns per-algorithm response with:
   - `cost`
   - `time`
   - `route`
   - optional `skipped` message
7. Frontend receives result and updates:
   - benchmark table
   - time/cost bar charts
   - insights panel
   - selected route drawing on canvas

### Database note
- No database layer exists in the current implementation.
- Data is transient/in-memory per request.

---

## 7. Key Algorithms / Logic

### 1) Brute Force (Exact)
- Tries all possible city visit orders.
- Guarantees optimal route.
- Complexity: factorial, roughly `O(n!)`.
- Practical only for small `n`.

### 2) Nearest Neighbor (Heuristic)
- Always picks nearest unvisited city from current node.
- Very fast but may miss optimal solution.
- Complexity: `O(n^2)`.

### 3) Held-Karp (Dynamic Programming, Exact)
- Uses subset DP with bitmasks.
- Guarantees optimal route with better scaling than brute force.
- Complexity: `O(n^2 * 2^n)` time, `O(n * 2^n)` memory.

### 4) Branch and Bound (Exact Search)
- Uses DFS with pruning against current best cost.
- Often faster than brute force on moderate inputs.
- Worst-case remains exponential.

### Supporting logic
- Euclidean distance matrix generation from `(x, y)` cities.
- Execution-time measurement for each algorithm.
- Skip thresholds for expensive algorithms in larger inputs.

---

## 8. Technologies Used

### Frontend
- HTML5: page structure and semantic sections
- CSS3: responsive dashboard and visual theme
- Vanilla JavaScript: state, algorithm execution, rendering logic
- Canvas API: route drawing
- Chart.js: benchmark chart visualization

### Backend
- Node.js: runtime for API and process orchestration
- Express.js: REST API and static file serving
- CORS middleware: cross-origin support for frontend-backend communication
- Child process (`spawn`): runs compiled C++ executable

### C++ layer
- C++17: high-performance algorithm execution
- STL containers/algorithms (`vector`, `next_permutation`, etc.)
- `chrono`: timing measurements

### Why these choices fit
- JavaScript frontend enables immediate interactivity and easy visualization.
- Express offers simple, reliable API setup.
- C++ provides faster compute for algorithm-heavy workloads.
- Hybrid architecture cleanly separates UI and compute concerns.

---

## 9. Possible Improvements

### Performance
- Add stronger lower-bound heuristics in Branch and Bound for more effective pruning.
- Add input-size guardrails and adaptive algorithm selection based on `n`.
- Cache distance matrices/results for repeated runs with same input.

### Code structure
- Remove duplication: same algorithms exist in frontend JS, backend JS, and C++.
- Extract shared response schema contracts and validation logic.
- Split `server.js` into modules (`routes`, `services`, `engines`, `utils`).

### Scalability
- Queue heavy compute jobs and support async job polling for large runs.
- Add worker process/thread pool for concurrent benchmark requests.
- Containerize C++ build/runtime for consistent deployment.

### UI/UX
- Add drag-and-drop city editing directly on canvas.
- Add route comparison overlay between two selected algorithms.
- Show algorithm complexity/tooltips inline for educational clarity.
- Add export options (CSV/JSON) for benchmark results.

### Reliability and maintainability
- Add automated tests:
  - unit tests for distance matrix and route cost
  - integration tests for `/api/run` and `/api/scalability`
- Add request schema validation (e.g., zod/joi) to harden API input handling.
- Add centralized logging and error IDs for easier debugging.

---

## 10. Conclusion

This project is a strong educational and technical demonstration of TSP algorithm benchmarking in a full-stack setup. It combines a responsive browser UI, practical API orchestration, and high-performance C++ execution to make algorithm trade-offs visible and measurable.

In its current form, it is already useful for learning and experimentation. With modularization, stronger pruning strategies, and automated testing, it can evolve into a robust benchmarking platform suitable for larger-scale algorithm analysis.
