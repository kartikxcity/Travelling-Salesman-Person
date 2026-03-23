
#include "nearest.h"
#include <climits>
int tsp_nearest(std::vector<std::vector<int>>& dist){
    int n=dist.size();
    std::vector<bool> vis(n,false);
    int cost=0,curr=0;
    vis[0]=true;
    for(int i=0;i<n-1;i++){
        int mn=INT_MAX,next=-1;
        for(int j=0;j<n;j++){
            if(!vis[j] && dist[curr][j]<mn){
                mn=dist[curr][j];
                next=j;
            }
        }
        vis[next]=true;
        cost+=mn;
        curr=next;
    }
    return cost+dist[curr][0];
}
