import { useState, useEffect } from 'react';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const useRateLimit = (config: RateLimitConfig = { maxRequests: 50, windowMs: 60000 }) => {
  const [requests, setRequests] = useState<number[]>([]);

  // Clean up old requests
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setRequests(prev => prev.filter(timestamp => now - timestamp < config.windowMs));
    }, config.windowMs);

    return () => clearInterval(cleanup);
  }, [config.windowMs]);

  const checkRateLimit = async (): Promise<void> => {
    const now = Date.now();
    const recentRequests = requests.filter(timestamp => now - timestamp < config.windowMs);

    if (recentRequests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const timeToWait = config.windowMs - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(timeToWait / 1000)} seconds.`);
    }

    setRequests(prev => [...prev, now]);
  };

  return { checkRateLimit };
};