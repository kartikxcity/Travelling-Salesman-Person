
#ifndef TIMER_H
#define TIMER_H
#include <chrono>
class Timer {
    std::chrono::high_resolution_clock::time_point start;
public:
    void startTimer(){ start = std::chrono::high_resolution_clock::now(); }
    double stopTimer(){
        auto end = std::chrono::high_resolution_clock::now();
        return std::chrono::duration<double, std::milli>(end - start).count();
    }
};
#endif
