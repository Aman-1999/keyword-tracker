import { NextRequest } from 'next/server';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
    interval: number; // Time window in milliseconds
    uniqueTokenPerInterval: number; // Max requests per interval
}

export function rateLimit(config: RateLimitConfig) {
    return {
        check: (request: NextRequest, limit: number, token: string) => {
            const now = Date.now();
            const tokenKey = `${token}`;

            if (!store[tokenKey] || store[tokenKey].resetTime < now) {
                store[tokenKey] = {
                    count: 0,
                    resetTime: now + config.interval,
                };
            }

            store[tokenKey].count += 1;

            const currentUsage = store[tokenKey].count;
            const isRateLimited = currentUsage > limit;

            return {
                success: !isRateLimited,
                limit,
                remaining: Math.max(0, limit - currentUsage),
                reset: new Date(store[tokenKey].resetTime),
            };
        },
    };
}

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}, 60000); // Clean up every minute
