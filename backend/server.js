const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CPP_EXECUTABLE = process.env.TSP_CPP_EXE || path.join(__dirname, "build", "tsp_runner.exe");

const ALGORITHMS = ["BruteForce", "Nearest", "HeldKarp", "BranchBound"];

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

function buildDistanceMatrix(cities) {
  const n = cities.length;
  const dist = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i === j) {
        dist[i][j] = 0;
      } else {
        const dx = cities[i].x - cities[j].x;
        const dy = cities[i].y - cities[j].y;
        dist[i][j] = Math.round(Math.hypot(dx, dy));
      }
    }
  }
  return dist;
}

function routeCost(route, dist) {
  let sum = 0;
  for (let i = 1; i < route.length; i += 1) {
    sum += dist[route[i - 1]][route[i]];
  }
  return sum;
}

function tspNearest(dist) {
  const n = dist.length;
  const visited = Array(n).fill(false);
  const route = [0];
  let current = 0;
  visited[0] = true;

  for (let step = 0; step < n - 1; step += 1) {
    let best = -1;
    let bestCost = Number.POSITIVE_INFINITY;
    for (let city = 0; city < n; city += 1) {
      if (!visited[city] && dist[current][city] < bestCost) {
        best = city;
        bestCost = dist[current][city];
      }
    }
    route.push(best);
    visited[best] = true;
    current = best;
  }

  route.push(0);
  return { cost: routeCost(route, dist), route };
}

function tspBruteForce(dist) {
  const n = dist.length;
  const limit = 10;
  if (n > limit) {
    return { cost: null, route: [], skipped: `Skipped (n > ${limit})` };
  }

  const remaining = [];
  for (let i = 1; i < n; i += 1) {
    remaining.push(i);
  }

  let bestCost = Number.POSITIVE_INFINITY;
  let bestRoute = [];

  function permute(startIdx) {
    if (startIdx === remaining.length) {
      const route = [0, ...remaining, 0];
      const cost = routeCost(route, dist);
      if (cost < bestCost) {
        bestCost = cost;
        bestRoute = route.slice();
      }
      return;
    }

    for (let i = startIdx; i < remaining.length; i += 1) {
      [remaining[startIdx], remaining[i]] = [remaining[i], remaining[startIdx]];
      permute(startIdx + 1);
      [remaining[startIdx], remaining[i]] = [remaining[i], remaining[startIdx]];
    }
  }

  permute(0);
  return { cost: bestCost, route: bestRoute };
}

function tspHeldKarp(dist) {
  const n = dist.length;
  const N = 1 << n;
  const INF = Number.POSITIVE_INFINITY;
  const dp = Array.from({ length: N }, () => Array(n).fill(INF));
  const parent = Array.from({ length: N }, () => Array(n).fill(-1));

  dp[1][0] = 0;

  for (let mask = 1; mask < N; mask += 1) {
    for (let u = 0; u < n; u += 1) {
      if ((mask & (1 << u)) === 0 || !Number.isFinite(dp[mask][u])) {
        continue;
      }
      for (let v = 0; v < n; v += 1) {
        if ((mask & (1 << v)) !== 0) {
          continue;
        }
        const next = mask | (1 << v);
        const candidate = dp[mask][u] + dist[u][v];
        if (candidate < dp[next][v]) {
          dp[next][v] = candidate;
          parent[next][v] = u;
        }
      }
    }
  }

  const fullMask = N - 1;
  let bestCost = INF;
  let endCity = -1;

  for (let i = 1; i < n; i += 1) {
    const candidate = dp[fullMask][i] + dist[i][0];
    if (candidate < bestCost) {
      bestCost = candidate;
      endCity = i;
    }
  }

  const reversedRoute = [0];
  let mask = fullMask;
  let current = endCity;

  while (current !== -1 && current !== 0) {
    reversedRoute.push(current);
    const p = parent[mask][current];
    mask ^= 1 << current;
    current = p;
  }

  reversedRoute.push(0);
  const route = reversedRoute.reverse();
  return { cost: bestCost, route };
}

function tspBranchBound(dist) {
  const n = dist.length;
  const limit = 11;
  if (n > limit) {
    return { cost: null, route: [], skipped: `Skipped (n > ${limit})` };
  }

  let bestCost = Number.POSITIVE_INFINITY;
  let bestRoute = [];
  const visited = Array(n).fill(false);
  visited[0] = true;

  function dfs(current, count, cost, path) {
    if (cost >= bestCost) {
      return;
    }
    if (count === n) {
      const total = cost + dist[current][0];
      if (total < bestCost) {
        bestCost = total;
        bestRoute = [...path, 0];
      }
      return;
    }

    for (let next = 1; next < n; next += 1) {
      if (!visited[next]) {
        visited[next] = true;
        path.push(next);
        dfs(next, count + 1, cost + dist[current][next], path);
        path.pop();
        visited[next] = false;
      }
    }
  }

  dfs(0, 1, 0, [0]);
  return { cost: bestCost, route: bestRoute };
}

function runOneAlgorithm(name, dist) {
  const start = performance.now();
  let output;
  if (name === "BruteForce") {
    output = tspBruteForce(dist);
  } else if (name === "Nearest") {
    output = tspNearest(dist);
  } else if (name === "HeldKarp") {
    output = tspHeldKarp(dist);
  } else {
    output = tspBranchBound(dist);
  }
  const time = performance.now() - start;
  return { ...output, time };
}

function runInJs(cities) {
  const dist = buildDistanceMatrix(cities);
  const results = {};
  for (const algo of ALGORITHMS) {
    results[algo] = runOneAlgorithm(algo, dist);
  }
  return results;
}

function runWithCpp(cities) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CPP_EXECUTABLE)) {
      reject(new Error("C++ executable not found. Set TSP_CPP_EXE or compile backend/build/tsp_runner.exe"));
      return;
    }

    const child = spawn(CPP_EXECUTABLE, [], {
      cwd: __dirname,
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (buf) => {
      stdout += buf.toString();
    });

    child.stderr.on("data", (buf) => {
      stderr += buf.toString();
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`C++ process failed: ${stderr || `exit ${code}`}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Invalid JSON from C++ process: ${err.message}`));
      }
    });

    const payload = [String(cities.length), ...cities.map((c) => `${Math.round(c.x)} ${Math.round(c.y)}`)].join("\n") + "\n";
    child.stdin.write(payload);
    child.stdin.end();
  });
}

function openBrowser(url) {
  try {
    if (process.platform === "win32") {
      const child = spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" });
      child.unref();
      return;
    }
    if (process.platform === "darwin") {
      const child = spawn("open", [url], { detached: true, stdio: "ignore" });
      child.unref();
      return;
    }
    const child = spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
    child.unref();
  } catch (_err) {
    // Browser auto-open is best-effort and should not block server startup.
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, cppReady: fs.existsSync(CPP_EXECUTABLE) });
});

app.post("/api/run", async (req, res) => {
  try {
    const cities = req.body?.cities;
    if (!Array.isArray(cities) || cities.length < 4) {
      return res.status(400).json({ error: "Provide cities as an array with at least 4 points." });
    }

    const mode = req.body?.engine || process.env.TSP_ENGINE || "cpp";
    const results = mode === "cpp" ? await runWithCpp(cities) : runInJs(cities);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/scalability", (req, res) => {
  try {
    const minCities = Number(req.body?.minCities || 4);
    const maxCities = Number(req.body?.maxCities || 10);

    const counts = [];
    const data = {
      BruteForce: [],
      Nearest: [],
      HeldKarp: [],
      BranchBound: []
    };

    function randomCities(n) {
      const out = [];
      for (let i = 0; i < n; i += 1) {
        out.push({ x: 40 + Math.random() * 600, y: 40 + Math.random() * 360 });
      }
      return out;
    }

    for (let n = minCities; n <= maxCities; n += 1) {
      counts.push(n);
      const dist = buildDistanceMatrix(randomCities(n));
      for (const algo of ALGORITHMS) {
        const result = runOneAlgorithm(algo, dist);
        data[algo].push(Number.isFinite(result.time) ? result.time : null);
      }
    }

    res.json({ counts, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`TSP server running on ${url}`);
  if (process.env.AUTO_OPEN_BROWSER !== "false") {
    openBrowser(url);
  }
});
