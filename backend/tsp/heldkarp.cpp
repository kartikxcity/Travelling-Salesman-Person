
#include "heldkarp.h"
#include <vector>
#include <climits>
using namespace std;
int tsp_heldkarp(vector<vector<int>>& dist){
    int n=dist.size();
    int N=1<<n;
    vector<vector<int>> dp(N,vector<int>(n,INT_MAX));
    dp[1][0]=0;
    for(int mask=1;mask<N;mask++){
        for(int u=0;u<n;u++){
            if(!(mask&(1<<u))) continue;
            for(int v=0;v<n;v++){
                if(mask&(1<<v)) continue;
                int next=mask|(1<<v);
                dp[next][v]=min(dp[next][v],dp[mask][u]+dist[u][v]);
            }
        }
    }
    int ans=INT_MAX;
    for(int i=1;i<n;i++){
        ans=min(ans,dp[N-1][i]+dist[i][0]);
    }
    return ans;
}
