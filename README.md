# TSP Final Full

A full-stack **Traveling Salesman Problem (TSP)** benchmarking and visualization project.

This project combines a **C++ backend (for high-performance algorithm execution)** with a **Node.js API bridge** and a **web-based frontend dashboard** for interactive analysis.

---

## 👨‍💻 Author

**Aditya Bhardwaj**
B.Tech CSE

---

## 🚀 Features

* 🧠 Multiple TSP Algorithms:

  * Brute Force
  * Nearest Neighbor
  * Held-Karp (Dynamic Programming)
  * Branch and Bound

* ⚡ Performance Benchmarking:

  * Execution time measurement
  * Route cost comparison

* 🌐 Full Stack Integration:

  * C++ algorithm engine
  * Node.js backend API
  * Web UI frontend

* 📊 Visualization (Frontend):

  * Results table
  * Interactive dashboard
  * Chart-based comparison (via Chart.js)

* 🔄 Flexible Execution:

  * Static JSON mode
  * Dynamic backend execution (C++ via Node.js)

---

## 📁 Project Structure

```
.
│   .gitignore
│   README.md
│
├── backend
│   │   cpp_runner.cpp
│   │   main.cpp
│   │   package.json
│   │   package-lock.json
│   │   server.js
│   │
│   ├── tsp
│   │       branchbound.cpp
│   │       branchbound.h
│   │       bruteforce.cpp
│   │       bruteforce.h
│   │       heldkarp.cpp
│   │       heldkarp.h
│   │       nearest.cpp
│   │       nearest.h
│   │
│   └── utils
│           timer.h
│
└── frontend
        index.html
        script.js
        style.css
```

---

## ⚙️ Requirements

* Node.js (v18 or higher recommended)
* C++ Compiler (g++ with C++17 support)

---

## 🛠️ Setup & Run

### 1️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

---

### 2️⃣ Run Backend Server (JavaScript Engine)

```bash
npm start
```

---

### 3️⃣ Run with C++ Engine (Recommended)

```bash
npm run start:cpp
```

This will:

* Compile C++ code
* Start Node.js server
* Enable C++ execution via API

---

### 4️⃣ Open Frontend

Option 1:

* Open `frontend/index.html` directly in browser

Option 2 (recommended):

```bash
cd frontend
python -m http.server 8000
```

Then open:

```
http://localhost:8000
```

---

## 🔌 How It Works

1. Frontend sends city data to backend
2. Backend triggers TSP algorithms (JS or C++)
3. Each algorithm computes:

   * Total route cost
   * Execution time
4. Results returned as JSON
5. Frontend visualizes results in UI

---

## 📊 Algorithms Overview

| Algorithm        | Type       | Accuracy  | Speed             |
| ---------------- | ---------- | --------- | ----------------- |
| Brute Force      | Exact      | ✅ Optimal | ❌ Very Slow       |
| Held-Karp        | Exact (DP) | ✅ Optimal | ⚠️ Medium         |
| Branch & Bound   | Exact      | ✅ Optimal | ⚠️ Faster than BF |
| Nearest Neighbor | Heuristic  | ❌ Approx  | ✅ Fast            |

---

## ⚠️ Notes

* Generated files are ignored using `.gitignore`
* If `node_modules` is deleted, run `npm install` again
* Brute Force is not suitable for large inputs (exponential time)

---

## 🔮 Future Improvements

* Route visualization on canvas
* Drag-and-drop city editing
* Advanced analytics & insights
* Better scalability testing
* Full C++ API optimization

---

## ⭐ Final Thought

This project demonstrates how different algorithms behave on the same problem, highlighting the trade-offs between **optimality and performance** in solving NP-hard problems like TSP.

---
