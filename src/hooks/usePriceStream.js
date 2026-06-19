'use client';

import { useEffect, useCallback } from 'react';

/**
 * Subscribe to real-time price updates via SSE.
 * @param {Function} onUpdate - Called with { productId, platform, price, productName }
 */
export function usePriceStream(onUpdate) {
  const handleUpdate = useCallback(onUpdate, []);

  useEffect(() => {
    let eventSource;
    let retryTimeout;
    let retryDelay = 2000;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/stream');

        eventSource.onmessage = (e) => {
          if (!e.data || e.data.startsWith(':')) return;
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'price_update') {
              handleUpdate(data);
            }
          } catch {}
        };

        eventSource.onerror = () => {
          eventSource?.close();
          // Exponential backoff reconnect
          retryTimeout = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 1.5, 30000);
            connect();
          }, retryDelay);
        };

        eventSource.onopen = () => {
          retryDelay = 2000; // Reset delay on success
        };
      } catch {}
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      eventSource?.close();
    };
  }, [handleUpdate]);
}
