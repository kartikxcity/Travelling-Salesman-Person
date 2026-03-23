
#include "branchbound.h"
#include <climits>
using namespace std;

int n, final_res;
vector<vector<int>> d;

void tspRec(vector<bool>& vis,int curr,int count,int cost){
    if(count==n && d[curr][0]){
        final_res=min(final_res,cost+d[curr][0]);
        return;
    }
    for(int i=0;i<n;i++){
        if(!vis[i]){
            vis[i]=true;
            tspRec(vis,i,count+1,cost+d[curr][i]);
            vis[i]=false;
        }
    }
}

int tsp_branchbound(vector<vector<int>>& dist){
    d=dist; n=d.size();
    final_res=INT_MAX;
    vector<bool> vis(n,false);
    vis[0]=true;
    tspRec(vis,0,1,0);
    return final_res;
}
