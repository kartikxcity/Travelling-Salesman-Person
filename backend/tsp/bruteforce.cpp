
#include "bruteforce.h"
#include <algorithm>
#include <climits>
int tsp_bruteforce(std::vector<std::vector<int>>& dist){
    int n=dist.size();
    std::vector<int> perm;
    for(int i=1;i<n;i++) perm.push_back(i);
    int min_cost=INT_MAX;
    do{
        int cost=0,prev=0;
        for(int i:perm){ cost+=dist[prev][i]; prev=i;}
        cost+=dist[prev][0];
        min_cost=std::min(min_cost,cost);
    }while(std::next_permutation(perm.begin(),perm.end()));
    return min_cost;
}
