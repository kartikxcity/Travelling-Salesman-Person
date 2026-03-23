
const ALGORITHMS = ["BruteForce", "Nearest", "HeldKarp", "BranchBound"];
const CITY_PADDING = 32;

const state = {
    cities: [],
    dist: [],
    results: {},
    scalability: {},
    charts: {
        time: null,
        cost: null,
        scalability: null
    }
};

const cityCountInput = document.getElementById("cityCount");
const executionModeSelect = document.getElementById("executionMode");
const algorithmSelect = document.getElementById("algorithmSelect");
const showRouteInput = document.getElementById("showRoute");
const generateBtn = document.getElementById("generateBtn");
const runBtn = document.getElementById("runBtn");
const scalabilityBtn = document.getElementById("scalabilityBtn");
const applyCustomBtn = document.getElementById("applyCustomBtn");
const customCoordsInput = document.getElementById("customCoords");
const statusText = document.getElementById("status");
const resultsBody = document.getElementById("resultsBody");
const insightsList = document.getElementById("insightsList");

const canvas = document.getElementById("cityCanvas");
const ctx = canvas.getContext("2d");

function setStatus(message) {
    statusText.textContent = message;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCities(n) {
    const w = canvas.width;
    const h = canvas.height;
    const cities = [];
    for (let i = 0; i < n; i += 1) {
        cities.push({
            x: randomInt(CITY_PADDING, w - CITY_PADDING),
            y: randomInt(CITY_PADDING, h - CITY_PADDING)
        });
    }
    return cities;
}

function parseCustomCities(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed = [];
    for (const line of lines) {
        const [xs, ys] = line.split(",").map((p) => p.trim());
        const x = Number(xs);
        const y = Number(ys);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            throw new Error(`Invalid coordinate line: ${line}`);
        }
        parsed.push({ x, y });
    }
    return parsed;
}

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

function runAlgorithm(name, dist) {
    const start = performance.now();
    let result;
    if (name === "BruteForce") {
        result = tspBruteForce(dist);
    } else if (name === "Nearest") {
        result = tspNearest(dist);
    } else if (name === "HeldKarp") {
        result = tspHeldKarp(dist);
    } else {
        result = tspBranchBound(dist);
    }
    const elapsed = performance.now() - start;
    return { ...result, time: elapsed };
}

async function runAlgorithmsBrowser() {
    const dist = state.dist;
    const results = {};

    for (const algo of ALGORITHMS) {
        results[algo] = runAlgorithm(algo, dist);
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results;
}

async function runAlgorithmsApi() {
    const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cities: state.cities, engine: "cpp" })
    });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Backend API request failed.");
    }
    return response.json();
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const selectedAlgo = algorithmSelect.value;
    const selectedResult = state.results[selectedAlgo];
    const canDrawRoute = showRouteInput.checked && selectedResult && Array.isArray(selectedResult.route) && selectedResult.route.length > 1;

    if (canDrawRoute) {
        ctx.save();
        ctx.strokeStyle = "rgba(19, 91, 255, 0.82)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        const first = state.cities[selectedResult.route[0]];
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < selectedResult.route.length; i += 1) {
            const city = state.cities[selectedResult.route[i]];
            ctx.lineTo(city.x, city.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    for (let i = 0; i < state.cities.length; i += 1) {
        const city = state.cities[i];
        ctx.beginPath();
        ctx.fillStyle = i === 0 ? "#0f2742" : "#ef4f2f";
        ctx.arc(city.x, city.y, i === 0 ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "12px Space Grotesk";
        ctx.fillStyle = "#1f2833";
        ctx.fillText(String(i), city.x + 8, city.y - 8);
    }
}

function formatResultValue(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "N/A";
    }
    return String(Math.round(value * 1000) / 1000);
}

function renderResultsTable() {
    const rows = ALGORITHMS.map((algo) => {
        const r = state.results[algo];
        if (!r) {
            return `<tr><td>${algo}</td><td>-</td><td>-</td><td>-</td></tr>`;
        }
        const routeText = r.route && r.route.length ? r.route.join(" -> ") : (r.skipped || "N/A");
        return `<tr>
            <td>${algo}</td>
            <td>${formatResultValue(r.cost)}</td>
            <td>${formatResultValue(r.time)}</td>
            <td>${routeText}</td>
        </tr>`;
    }).join("");
    resultsBody.innerHTML = rows;
}

function buildBarChart(canvasId, label, dataValues, color) {
    const existing = state.charts[label];
    if (existing) {
        existing.destroy();
    }

    const chart = new Chart(document.getElementById(canvasId), {
        type: "bar",
        data: {
            labels: ALGORITHMS,
            datasets: [{
                label,
                data: dataValues,
                backgroundColor: color,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: "#1f2833" },
                    grid: { color: "rgba(31,40,51,0.15)" }
                },
                x: {
                    ticks: { color: "#1f2833" },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    state.charts[label] = chart;
}

function renderPerformanceCharts() {
    const times = ALGORITHMS.map((a) => Number.isFinite(state.results[a]?.time) ? state.results[a].time : null);
    const costs = ALGORITHMS.map((a) => Number.isFinite(state.results[a]?.cost) ? state.results[a].cost : null);
    buildBarChart("timeChart", "time", times, "rgba(239,79,47,0.82)");
    buildBarChart("costChart", "cost", costs, "rgba(19,91,255,0.80)");
}

function renderScalabilityChart() {
    if (state.charts.scalability) {
        state.charts.scalability.destroy();
    }

    const labels = state.scalability.counts || [];
    const datasets = ALGORITHMS.map((algo, idx) => {
        const colors = ["#ef4f2f", "#1f7a8c", "#135bff", "#112d4e"];
        return {
            label: algo,
            data: state.scalability[algo] || [],
            borderColor: colors[idx],
            backgroundColor: colors[idx],
            tension: 0.25,
            fill: false
        };
    });

    state.charts.scalability = new Chart(document.getElementById("scalabilityChart"), {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "ms" }
                },
                x: {
                    title: { display: true, text: "Cities" }
                }
            }
        }
    });
}

function renderInsights() {
    const valid = ALGORITHMS
        .map((algo) => ({ algo, ...state.results[algo] }))
        .filter((r) => Number.isFinite(r.cost) && Number.isFinite(r.time));

    if (valid.length === 0) {
        insightsList.innerHTML = "<li>No benchmark data available yet.</li>";
        return;
    }

    const fastest = [...valid].sort((a, b) => a.time - b.time)[0];
    const optimal = [...valid].sort((a, b) => a.cost - b.cost)[0];
    const nearest = valid.find((r) => r.algo === "Nearest");

    const lines = [];
    lines.push(`Fastest algorithm: ${fastest.algo} (${formatResultValue(fastest.time)} ms).`);
    lines.push(`Most optimal route cost: ${optimal.algo} (${formatResultValue(optimal.cost)}).`);

    if (nearest && Number.isFinite(nearest.cost) && Number.isFinite(optimal.cost)) {
        const gap = ((nearest.cost - optimal.cost) / optimal.cost) * 100;
        if (gap > 0) {
            lines.push(`Speed-accuracy trade-off: Nearest is often quicker but is ${formatResultValue(gap)}% above optimal in this run.`);
        } else {
            lines.push("Speed-accuracy trade-off: Nearest matched optimal cost in this run.");
        }
    }

    insightsList.innerHTML = lines.map((l) => `<li>${l}</li>`).join("");
}

async function runBenchmarks() {
    if (state.cities.length < 4) {
        setStatus("Need at least 4 cities.");
        return;
    }

    setStatus("Running algorithms...");
    try {
        if (executionModeSelect.value === "api") {
            state.results = await runAlgorithmsApi();
        } else {
            state.results = await runAlgorithmsBrowser();
        }
        renderResultsTable();
        renderPerformanceCharts();
        renderInsights();
        drawScene();
        setStatus("Algorithms finished.");
    } catch (err) {
        setStatus(`Run failed: ${err.message}`);
    }
}

async function runScalability() {
    setStatus("Running scalability experiment...");
    const maxN = Number(cityCountInput.value);
    const counts = [];
    const data = {
        BruteForce: [],
        Nearest: [],
        HeldKarp: [],
        BranchBound: []
    };

    for (let n = 4; n <= maxN; n += 1) {
        const cities = generateCities(n);
        const dist = buildDistanceMatrix(cities);
        counts.push(n);
        for (const algo of ALGORITHMS) {
            const r = runAlgorithm(algo, dist);
            data[algo].push(Number.isFinite(r.time) ? r.time : null);
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    state.scalability = { counts, ...data };
    renderScalabilityChart();
    setStatus("Scalability chart updated.");
}

function applyGeneratedCities() {
    const n = Number(cityCountInput.value);
    state.cities = generateCities(n);
    state.dist = buildDistanceMatrix(state.cities);
    state.results = {};
    renderResultsTable();
    renderInsights();
    drawScene();
    setStatus(`Generated ${n} cities.`);
}

function applyCustomCities() {
    try {
        const parsed = parseCustomCities(customCoordsInput.value);
        if (parsed.length < 4) {
            setStatus("Custom input needs at least 4 cities.");
            return;
        }
        state.cities = parsed;
        cityCountInput.value = String(parsed.length);
        state.dist = buildDistanceMatrix(state.cities);
        state.results = {};
        renderResultsTable();
        renderInsights();
        drawScene();
        setStatus(`Loaded ${parsed.length} custom cities.`);
    } catch (err) {
        setStatus(`Custom input error: ${err.message}`);
    }
}

generateBtn.addEventListener("click", applyGeneratedCities);
applyCustomBtn.addEventListener("click", applyCustomCities);
runBtn.addEventListener("click", runBenchmarks);
scalabilityBtn.addEventListener("click", runScalability);
algorithmSelect.addEventListener("change", drawScene);
showRouteInput.addEventListener("change", drawScene);

applyGeneratedCities();
