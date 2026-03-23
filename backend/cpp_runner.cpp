#include <algorithm>
#include <chrono>
#include <cmath>
#include <functional>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

using namespace std;

struct TspResult {
    bool skipped = false;
    string skippedMsg;
    long long cost = 0;
    vector<int> route;
    double timeMs = 0.0;
};

static string routeToJson(const vector<int>& route) {
    string out = "[";
    for (size_t i = 0; i < route.size(); ++i) {
        out += to_string(route[i]);
        if (i + 1 < route.size()) {
            out += ",";
        }
    }
    out += "]";
    return out;
}

static long long routeCost(const vector<int>& route, const vector<vector<int>>& dist) {
    long long sum = 0;
    for (size_t i = 1; i < route.size(); ++i) {
        sum += dist[route[i - 1]][route[i]];
    }
    return sum;
}

static TspResult tspNearest(const vector<vector<int>>& dist) {
    int n = static_cast<int>(dist.size());
    vector<bool> vis(n, false);
    vector<int> route;
    route.reserve(n + 1);
    route.push_back(0);
    vis[0] = true;

    int curr = 0;
    for (int step = 0; step < n - 1; ++step) {
        int best = -1;
        int bestCost = numeric_limits<int>::max();
        for (int city = 0; city < n; ++city) {
            if (!vis[city] && dist[curr][city] < bestCost) {
                best = city;
                bestCost = dist[curr][city];
            }
        }
        vis[best] = true;
        route.push_back(best);
        curr = best;
    }

    route.push_back(0);
    TspResult r;
    r.cost = routeCost(route, dist);
    r.route = move(route);
    return r;
}

static TspResult tspBruteForce(const vector<vector<int>>& dist) {
    int n = static_cast<int>(dist.size());
    const int limit = 10;
    if (n > limit) {
        TspResult skipped;
        skipped.skipped = true;
        skipped.skippedMsg = "Skipped (n > 10)";
        return skipped;
    }

    vector<int> perm;
    for (int i = 1; i < n; ++i) {
        perm.push_back(i);
    }

    long long bestCost = numeric_limits<long long>::max();
    vector<int> bestRoute;

    do {
        vector<int> route;
        route.reserve(n + 1);
        route.push_back(0);
        for (int city : perm) {
            route.push_back(city);
        }
        route.push_back(0);

        long long cost = routeCost(route, dist);
        if (cost < bestCost) {
            bestCost = cost;
            bestRoute = route;
        }
    } while (next_permutation(perm.begin(), perm.end()));

    TspResult r;
    r.cost = bestCost;
    r.route = move(bestRoute);
    return r;
}

static TspResult tspHeldKarp(const vector<vector<int>>& dist) {
    int n = static_cast<int>(dist.size());
    int N = 1 << n;
    const long long INF = numeric_limits<long long>::max() / 4;

    vector<vector<long long>> dp(N, vector<long long>(n, INF));
    vector<vector<int>> parent(N, vector<int>(n, -1));

    dp[1][0] = 0;

    for (int mask = 1; mask < N; ++mask) {
        for (int u = 0; u < n; ++u) {
            if (!(mask & (1 << u)) || dp[mask][u] == INF) {
                continue;
            }
            for (int v = 0; v < n; ++v) {
                if (mask & (1 << v)) {
                    continue;
                }
                int next = mask | (1 << v);
                long long candidate = dp[mask][u] + dist[u][v];
                if (candidate < dp[next][v]) {
                    dp[next][v] = candidate;
                    parent[next][v] = u;
                }
            }
        }
    }

    int fullMask = N - 1;
    long long best = INF;
    int endCity = -1;

    for (int i = 1; i < n; ++i) {
        long long candidate = dp[fullMask][i] + dist[i][0];
        if (candidate < best) {
            best = candidate;
            endCity = i;
        }
    }

    vector<int> reversePath;
    int mask = fullMask;
    int current = endCity;

    while (current != -1 && current != 0) {
        reversePath.push_back(current);
        int p = parent[mask][current];
        mask ^= (1 << current);
        current = p;
    }

    vector<int> route;
    route.reserve(n + 1);
    route.push_back(0);
    for (int i = static_cast<int>(reversePath.size()) - 1; i >= 0; --i) {
        route.push_back(reversePath[i]);
    }
    route.push_back(0);

    TspResult r;
    r.cost = best;
    r.route = move(route);
    return r;
}

static TspResult tspBranchBound(const vector<vector<int>>& dist) {
    int n = static_cast<int>(dist.size());
    const int limit = 11;
    if (n > limit) {
        TspResult skipped;
        skipped.skipped = true;
        skipped.skippedMsg = "Skipped (n > 11)";
        return skipped;
    }

    long long bestCost = numeric_limits<long long>::max();
    vector<int> bestRoute;

    vector<bool> vis(n, false);
    vis[0] = true;
    vector<int> path = {0};

    function<void(int, int, long long)> dfs = [&](int curr, int count, long long cost) {
        if (cost >= bestCost) {
            return;
        }
        if (count == n) {
            long long total = cost + dist[curr][0];
            if (total < bestCost) {
                bestCost = total;
                bestRoute = path;
                bestRoute.push_back(0);
            }
            return;
        }

        for (int next = 1; next < n; ++next) {
            if (!vis[next]) {
                vis[next] = true;
                path.push_back(next);
                dfs(next, count + 1, cost + dist[curr][next]);
                path.pop_back();
                vis[next] = false;
            }
        }
    };

    dfs(0, 1, 0);

    TspResult r;
    r.cost = bestCost;
    r.route = move(bestRoute);
    return r;
}

template <typename Solver>
static TspResult timedRun(Solver solver, const vector<vector<int>>& dist) {
    auto start = chrono::high_resolution_clock::now();
    TspResult r = solver(dist);
    auto end = chrono::high_resolution_clock::now();
    r.timeMs = chrono::duration<double, milli>(end - start).count();
    return r;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n < 4) {
        cout << "{\"error\":\"Invalid input. Expected n>=4 then n lines: x y\"}";
        return 0;
    }

    vector<pair<int, int>> cities;
    cities.reserve(n);
    for (int i = 0; i < n; ++i) {
        int x, y;
        if (!(cin >> x >> y)) {
            cout << "{\"error\":\"Invalid city coordinate input\"}";
            return 0;
        }
        cities.push_back({x, y});
    }

    vector<vector<int>> dist(n, vector<int>(n, 0));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            if (i == j) {
                dist[i][j] = 0;
            } else {
                long long dx = static_cast<long long>(cities[i].first) - cities[j].first;
                long long dy = static_cast<long long>(cities[i].second) - cities[j].second;
                dist[i][j] = static_cast<int>(llround(sqrt(static_cast<double>(dx * dx + dy * dy))));
            }
        }
    }

    TspResult bruteForce = timedRun(tspBruteForce, dist);
    TspResult nearest = timedRun(tspNearest, dist);
    TspResult heldKarp = timedRun(tspHeldKarp, dist);
    TspResult branchBound = timedRun(tspBranchBound, dist);

    auto appendResultJson = [](const string& name, const TspResult& r, bool withComma) {
        cout << "\"" << name << "\":{";
        if (r.skipped) {
            cout << "\"cost\":null,\"time\":" << fixed << setprecision(6) << r.timeMs
                 << ",\"route\":[],\"skipped\":\"" << r.skippedMsg << "\"";
        } else {
            cout << "\"cost\":" << r.cost << ",\"time\":" << fixed << setprecision(6) << r.timeMs
                 << ",\"route\":" << routeToJson(r.route);
        }
        cout << "}";
        if (withComma) {
            cout << ",";
        }
    };

    cout << "{";
    appendResultJson("BruteForce", bruteForce, true);
    appendResultJson("Nearest", nearest, true);
    appendResultJson("HeldKarp", heldKarp, true);
    appendResultJson("BranchBound", branchBound, false);
    cout << "}";

    return 0;
}
