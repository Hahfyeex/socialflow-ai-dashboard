import { Router, Request, Response } from 'express';
import { queueManager } from '../queues/queueManager';
import { jobMonitor, JobStatus } from '../services/jobMonitor';

const router = Router();

/**
 * GET /jobs/stats
 * Get system-wide job statistics
 */
router.get('/jobs/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await jobMonitor.getSystemStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /jobs/queues
 * Get list of all queue names
 */
router.get('/jobs/queues', (_req: Request, res: Response) => {
  try {
    const queues = jobMonitor.getQueueNames();
    res.json({ queues, count: queues.length });
  } catch (error: any) {
    console.error('Error getting queue names:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /jobs/:queue/stats
 * Get statistics for a specific queue
 */
router.get('/jobs/:queue/stats', async (req: Request, res: Response) => {
  try {
    const { queue } = req.params;
    const stats = await jobMonitor.getQueueStats(queue);
    
    if (!stats) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    res.json(stats);
  } catch (error: any) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /jobs/:queue/jobs
 * Get jobs from a queue with optional status filter
 */
router.get('/jobs/:queue/jobs', async (req: Request, res: Response) => {
  try {
    const { queue } = req.params;
    const status = (req.query.status as JobStatus) || 'waiting';
    const start = parseInt(req.query.start as string) || 0;
    const end = parseInt(req.query.end as string) || 20;

    const jobs = await jobMonitor.getJobs(queue, status, start, end);
    res.json({ jobs, count: jobs.length, status, start, end });
  } catch (error: any) {
    console.error('Error getting jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /jobs/:queue/jobs/:jobId
 * Get a specific job by ID
 */
router.get('/jobs/:queue/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { queue, jobId } = req.params;
    const job = await jobMonitor.getJob(queue, jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error: any) {
    console.error('Error getting job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /jobs/:queue/failed
 * Get failed jobs from a queue
 */
router.get('/jobs/:queue/failed', async (req: Request, res: Response) => {
  try {
    const { queue } = req.params;
    const start = parseInt(req.query.start as string) || 0;
    const end = parseInt(req.query.end as string) || 20;

    const failed = await jobMonitor.getJobs(queue, 'failed', start, end);
    res.json({ jobs: failed, count: failed.length });
  } catch (error: any) {
    console.error('Error getting failed jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /jobs/:queue/jobs/:jobId/retry
 * Retry a specific job
 */
router.post('/jobs/:queue/jobs/:jobId/retry', async (req: Request, res: Response) => {
  try {
    const { queue, jobId } = req.params;
    const success = await jobMonitor.retryJob(queue, jobId);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to retry job' });
    }

    res.json({ success: true, message: `Job ${jobId} retry initiated` });
  } catch (error: any) {
    console.error('Error retrying job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /jobs/:queue/retry-all
 * Retry all failed jobs in a queue
 */
router.post('/jobs/:queue/retry-all', async (req: Request, res: Response) => {
  try {
    const { queue } = req.params;
    const retried = await jobMonitor.retryAllFailed(queue);
    
    res.json({ success: true, retried, message: `${retried} jobs retried` });
  } catch (error: any) {
    console.error('Error retrying all failed jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /jobs/:queue/jobs/:jobId
 * Remove a specific job
 */
router.delete('/jobs/:queue/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { queue, jobId } = req.params;
    const success = await jobMonitor.removeJob(queue, jobId);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to remove job' });
    }

    res.json({ success: true, message: `Job ${jobId} removed` });
  } catch (error: any) {
    console.error('Error removing job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /jobs/:queue/pause
 * Pause a queue
 */
router.post('/jobs/:queue/pause', async (req: Request, res: Response) => {
  try {
    const { queue } = req.params;
    const success = await jobMonitor.pauseQueue(queue);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to pause queue' });
    }

    res.json({ success: true, message: `Queue "${queue}" paused` });
  } catch (error: any) {
    console.error('Error pausing queue:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /jobs/:queue/resume
 * Resume a queue
 */
router.post('/jobs/:queue/resume', async (req: Request, res: Response) => {
  try {
    const { queue } = req.params;
    const success = await jobMonitor.resumeQueue(queue);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to resume queue' });
    }

    res.json({ success: true, message: `Queue "${queue}" resumed` });
  } catch (error: any) {
    console.error('Error resuming queue:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /jobs/:queue/clear
 * Clear all jobs from a queue
 */
router.delete('/jobs/:queue/clear', async (req: Request, res: Response) => {
  try {
    const { queue } = req.params;
    const success = await jobMonitor.clearQueue(queue);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to clear queue' });
    }

    res.json({ success: true, message: `Queue "${queue}" cleared` });
  } catch (error: any) {
    console.error('Error clearing queue:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /jobs/events
 * Get SSE endpoint for real-time job events
 */
router.get('/jobs/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const eventHandler = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to job events
  jobMonitor.on('job-completed', eventHandler);
  jobMonitor.on('job-failed', eventHandler);
  jobMonitor.on('job-stalled', eventHandler);
  jobMonitor.on('job-progress', eventHandler);

  // Cleanup on disconnect
  req.on('close', () => {
    jobMonitor.off('job-completed', eventHandler);
    jobMonitor.off('job-failed', eventHandler);
    jobMonitor.off('job-stalled', eventHandler);
    jobMonitor.off('job-progress', eventHandler);
  });
});

export default router;
