
#include <iostream>
#include <vector>
#include <fstream>
#include "tsp/bruteforce.h"
#include "tsp/nearest.h"
#include "tsp/heldkarp.h"
#include "tsp/branchbound.h"
#include "utils/timer.h"
using namespace std;

int main(){
    vector<vector<int>> dist={
        {0,10,15,20},
        {10,0,35,25},
        {15,35,0,30},
        {20,25,30,0}
    };

    Timer t;
    ofstream f("backend/output/result.json");
    f<<"{\n";

    t.startTimer();
    int bf=tsp_bruteforce(dist);
    f<<"\"BruteForce\":{\"cost\":"<<bf<<",\"time\":"<<t.stopTimer()<<"},\n";

    t.startTimer();
    int nn=tsp_nearest(dist);
    f<<"\"Nearest\":{\"cost\":"<<nn<<",\"time\":"<<t.stopTimer()<<"},\n";

    t.startTimer();
    int hk=tsp_heldkarp(dist);
    f<<"\"HeldKarp\":{\"cost\":"<<hk<<",\"time\":"<<t.stopTimer()<<"},\n";

    t.startTimer();
    int bb=tsp_branchbound(dist);
    f<<"\"BranchBound\":{\"cost\":"<<bb<<",\"time\":"<<t.stopTimer()<<"}\n";

    f<<"}";
    f.close();
}
