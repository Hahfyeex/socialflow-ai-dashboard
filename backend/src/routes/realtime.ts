import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';
import { eventBus, JobProgressEvent } from '../lib/eventBus';
import { createLogger } from '../lib/logger';

const router = Router();
const logger = createLogger('SSE');
const JWT_SECRET = () => process.env.JWT_SECRET ?? 'change-me-in-production';

/**
 * GET /api/realtime/stream
 *
 * Server-Sent Events stream for real-time job progress.
 *
 * Auth: Bearer token via Authorization header OR ?token= query param
 * (query param needed because browser EventSource can't set headers).
 *
 * Reconnection: browser auto-reconnects using Last-Event-ID.
 */
router.get('/stream', (req: AuthRequest, res: Response) => {
  // Accept token from header or query param
  let userId: string | undefined;
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : queryToken;

  if (!token) {
    res.status(401).json({ message: 'Missing token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET()) as jwt.JwtPayload;
    userId = payload.sub as string;
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  logger.info(`SSE client connected`, { userId });
  const send = (event: string, data: unknown, id?: string) => {
    if (id) res.write(`id: ${id}\n`);
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial connected event
  send('connected', { userId, ts: Date.now() });

  // Heartbeat every 25s to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25_000);

  // Forward job progress events for this user
  const onJob = (event: JobProgressEvent) => {
    send('job_progress', event, `${event.jobId}-${event.progress}`);
  };

  eventBus.onUserJob(userId, onJob);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.offUserJob(userId, onJob);
    logger.info(`SSE client disconnected`, { userId });
  });
});

export default router;
