# PR Description: Background Job Queue System Implementation

## Summary

Implemented a robust async job queue system using BullMQ and Redis for the SocialFlow AI Dashboard backend. This system handles email sending, blockchain transactions, scheduled payouts, and notification delivery with proper retry logic, exponential backoff, and comprehensive monitoring.

## Issue

- **GitHub Issue**: #332 - Implement a Background Job Queue System
- **Repository**: Christopherdominic/soroban-ajo

## Changes Made

### New Files Created

| File | Description |
|------|-------------|
| `backend/src/queues/queueManager.ts` | Centralized QueueManager class for BullMQ with Redis connection |
| `backend/src/queues/emailQueue.ts` | Email queue with sendEmail, sendBulkEmails, scheduleEmail functions |
| `backend/src/queues/payoutQueue.ts` | Payout queue with delayed/scheduled payout support |
| `backend/src/queues/syncQueue.ts` | Blockchain sync queue for account, transactions, balances, contracts |
| `backend/src/queues/notificationQueue.ts` | Notification queue supporting push, SMS, webhooks, Slack, Discord |
| `backend/src/jobs/emailJob.ts` | Email worker with progress tracking and bulk email processing |
| `backend/src/jobs/payoutJob.ts` | Payout worker with blockchain transaction logic |
| `backend/src/jobs/workers.ts` | Central worker initialization file |
| `backend/src/routes/jobs.ts` | REST endpoints for job monitoring and management |
| `backend/src/services/jobMonitor.ts` | Job monitoring service with event handling |

### Modified Files

| File | Changes |
|------|---------|
| `backend/src/server.ts` | Added worker initialization on startup and graceful shutdown handling |
| `backend/src/app.ts` | Integrated job routes |
| `backend/src/queues/index.ts` | Added exports for all queue modules |
| `backend/src/jobs/index.ts` | Added exports for all job modules |

## Features Implemented

### Queue Management
- ✅ Shared Redis connection via `process.env.REDIS_URL`
- ✅ Exponential backoff retry logic (delay: 2000ms)
- ✅ Configurable retry attempts (default: 3)
- ✅ Automatic cleanup of completed/failed jobs
- ✅ Event listeners for completed, failed, and stalled jobs

### Email Queue
- Single and bulk email sending
- Scheduled/delayed email delivery
- Templated email support
- Progress tracking
- Priority-based processing

### Payout Queue
- Immediate payout processing
- Delayed/scheduled payouts using BullMQ's `delay` option
- Recurring payouts (daily/weekly/monthly)
- Batch payout processing
- Audit trail (completed/failed jobs retained)
- Lower concurrency (3) for financial transactions

### Blockchain Sync Queue
- Account synchronization
- Transaction history sync
- Balance updates
- Smart contract deployment and syncing
- Batch account syncing
- Cron-based periodic sync scheduling

### Notification Queue
- Multiple notification types: push, SMS, in-app, webhook, Slack, Discord
- Bulk notification sending
- Scheduled notifications
- Priority-based processing (urgent/high/normal/low)

### Monitoring & Management
- REST API for job statistics
- Failed job retrieval
- Job retry functionality
- Queue pause/resume
- Queue clearing
- SSE endpoint for real-time events

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/stats` | System-wide job statistics |
| GET | `/api/jobs/queues` | List all queue names |
| GET | `/api/jobs/:queue/stats` | Queue statistics |
| GET | `/api/jobs/:queue/jobs` | Jobs with status filter |
| GET | `/api/jobs/:queue/failed` | Failed jobs |
| POST | `/api/jobs/:queue/jobs/:jobId/retry` | Retry specific job |
| POST | `/api/jobs/:queue/retry-all` | Retry all failed jobs |
| DELETE | `/api/jobs/:queue/jobs/:jobId` | Remove job |
| POST | `/api/jobs/:queue/pause` | Pause queue |
| POST | `/api/jobs/:queue/resume` | Resume queue |
| DELETE | `/api/jobs/:queue/clear` | Clear queue |
| GET | `/api/jobs/events` | SSE for real-time events |

## Worker Configuration

| Queue | Concurrency | Attempts | Backoff |
|-------|-------------|----------|---------|
| email | 10 | 3 | 2000ms |
| payout | 3 | 5 | 5000ms |
| sync | 5 | 3 | 3000ms |
| notification | 15 | 3 | 2000ms |

## Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379  # Preferred
# Or individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
```

## Testing

The implementation includes:
- TypeScript compilation verified
- Worker event handlers for failed/completed/stalled jobs
- Proper null checks (404 for queue not found)
- Graceful shutdown handling (SIGTERM/SIGINT)

## Migration Steps

1. Ensure Redis is running and accessible
2. Set `REDIS_URL` environment variable
3. Run `npm install` to install dependencies (bullmq, ioredis)
4. Start the server with `npm run dev`
5. Workers will be automatically initialized

## Breaking Changes

None - This is an additive implementation that doesn't affect existing functionality.

## Related Issues

- Related to Issue #332: Background Job Queue System
- Part of the overall system modernization for improved reliability and scalability

## Checklist

- [x] All queues implemented with BullMQ
- [x] Retry logic with exponential backoff
- [x] Job failure handling with logging
- [x] Queue health monitoring
- [x] Appropriate concurrency limits
- [x] Job priorities implemented
- [x] Completed jobs cleanup
- [x] Job execution logging
- [x] REST API for monitoring
- [x] Graceful shutdown handling
- [x] TypeScript compilation verified
