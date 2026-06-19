// In-memory event emitter for SSE (single process)
export const listeners = new Set();

export function broadcastPriceUpdate(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  listeners.forEach(ctrl => {
    try { ctrl.enqueue(new TextEncoder().encode(msg)); } catch {}
  });
}
