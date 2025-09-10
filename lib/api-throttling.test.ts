// Test API throttling and debouncing
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock fetch to track calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Throttling", () => {
    beforeEach(() => {
        mockFetch.mockClear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should demonstrate API call throttling concept", () => {
        console.log("🚦 API THROTTLING TEST");
        console.log("");

        let callCount = 0;
        const MIN_INTERVAL = 1000; // 1 second
        let lastCallTime = 0;

        const throttledApiCall = () => {
            const now = Date.now();
            if (now - lastCallTime >= MIN_INTERVAL) {
                callCount++;
                lastCallTime = now;
                console.log(`✅ API Call #${callCount} allowed at ${now}ms`);
                return true;
            } else {
                console.log(
                    `❌ API Call blocked - too recent (${now - lastCallTime}ms < ${MIN_INTERVAL}ms)`,
                );
                return false;
            }
        };

        // Simulate rapid API calls
        console.log("Simulating rapid API calls:");
        throttledApiCall(); // Should succeed

        vi.advanceTimersByTime(500);
        throttledApiCall(); // Should be blocked

        vi.advanceTimersByTime(300);
        throttledApiCall(); // Should be blocked

        vi.advanceTimersByTime(300); // Total 1100ms
        throttledApiCall(); // Should succeed

        expect(callCount).toBe(2);
        console.log(`\n📊 Result: ${callCount} calls allowed out of 4 attempts`);
        console.log("✅ Throttling working correctly!");
    });

    it("should demonstrate debouncing concept", () => {
        console.log("\n⏱️  DEBOUNCING TEST");
        console.log("");

        let executeCount = 0;
        const DEBOUNCE_DELAY = 500;
        let debounceTimeout: NodeJS.Timeout | null = null;

        const debouncedFunction = () => {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
                console.log("🔄 Previous timeout cleared");
            }

            debounceTimeout = setTimeout(() => {
                executeCount++;
                console.log(`✅ Function executed #${executeCount}`);
                debounceTimeout = null;
            }, DEBOUNCE_DELAY);

            console.log(`⏳ Timer set for ${DEBOUNCE_DELAY}ms`);
        };

        // Simulate rapid function calls
        console.log("Simulating rapid function calls:");
        debouncedFunction(); // Sets timer

        vi.advanceTimersByTime(200);
        debouncedFunction(); // Resets timer

        vi.advanceTimersByTime(200);
        debouncedFunction(); // Resets timer again

        vi.advanceTimersByTime(600); // Let the final timer complete

        expect(executeCount).toBe(1);
        console.log(
            `\n📊 Result: Function executed ${executeCount} time out of 3 calls`,
        );
        console.log("✅ Debouncing working correctly!");
    });

    it("should show the difference between throttling and debouncing", () => {
        console.log("\n🔄 THROTTLING vs DEBOUNCING COMPARISON");
        console.log("");

        // Throttling example
        let throttleCount = 0;
        let lastThrottleTime = 0;
        const throttleInterval = 1000;

        const throttle = () => {
            const now = Date.now();
            if (now - lastThrottleTime >= throttleInterval) {
                throttleCount++;
                lastThrottleTime = now;
                return true;
            }
            return false;
        };

        // Debouncing example
        let debounceCount = 0;
        let debounceTimer: NodeJS.Timeout | null = null;

        const debounce = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                debounceCount++;
                debounceTimer = null;
            }, 500);
        };

        // Simulate calls every 300ms for 3 seconds
        console.log("Calling functions every 300ms for 3 seconds:");

        for (let i = 0; i < 10; i++) {
            const time = i * 300;
            console.log(`\nTime: ${time}ms`);

            const throttleAllowed = throttle();
            debounce();

            console.log(
                `  Throttle: ${throttleAllowed ? "EXECUTE" : "SKIP"} (count: ${throttleCount})`,
            );
            console.log(`  Debounce: PENDING (will execute only after silence)`);

            vi.advanceTimersByTime(300);
        }

        // Let debounce timer complete
        vi.advanceTimersByTime(600);

        console.log(`\n📊 FINAL RESULTS:`);
        console.log(`   Throttle executed: ${throttleCount} times`);
        console.log(`   Debounce executed: ${debounceCount} times`);
        console.log("");
        console.log("📝 EXPLANATION:");
        console.log(
            "   • Throttling: Executes at regular intervals, ignores rapid calls",
        );
        console.log("   • Debouncing: Waits for silence, then executes once");
        console.log(
            "   • For API calls: Throttling prevents overload, Debouncing prevents spam",
        );

        expect(throttleCount).toBeGreaterThan(1); // Should execute multiple times
        expect(debounceCount).toBe(1); // Should execute only once at the end
    });
});
