import { NextResponse } from 'next/server';
import { listeners } from '@/lib/streamUtils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
      listeners.add(controller);

      // Heartbeat every 25s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          listeners.delete(controller);
        }
      }, 25000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeat);
        listeners.delete(controller);
      };

      // Store cleanup reference
      controller._cleanup = cleanup;
    },
    cancel(controller) {
      if (controller._cleanup) controller._cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
