/**
 * Mock API Server for Contract Testing
 * 
 * This server simulates the backend API responses for contract testing.
 * It implements the contracts defined in contracts.ts
 * 
 * Run with: npm run mock:server
 */

import http from 'http';

const PORT = process.env.PORT || 3000;

/**
 * Mock response handlers for each API endpoint
 */
const mockHandlers: Record<string, (body: unknown) => unknown> = {
  // Gemini API
  '/api/gemini/caption': (body) => {
    const { topic, platform, tone } = body as { topic: string; platform: string; tone: string };
    return {
      caption: `Generated ${tone} caption for ${platform} about: ${topic} #socialmedia`,
    };
  },
  
  '/api/gemini/reply': (body) => {
    const { conversationHistory } = body as { conversationHistory: string };
    return {
      replies: [
        'Thank you for reaching out!',
        'We appreciate your message.',
        'We will get back to you shortly.',
      ],
    };
  },

  // Webhook API
  '/api/webhooks': (body) => {
    const { url, secret } = body as { url: string; secret: string };
    return {
      id: `webhook-${Date.now()}`,
      url,
      secret,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rotationInProgress: false,
    };
  },

  '/api/webhooks/:id/rotate': (body) => {
    const { newSecret } = body as { newSecret: string };
    return {
      id: 'webhook-123',
      url: 'https://example.com/webhook',
      secret: newSecret,
      oldSecret: 'old-secret-key',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rotationInProgress: true,
      rotationStartedAt: new Date().toISOString(),
    };
  },

  // User API
  '/api/users': (body) => {
    const { email, name } = body as { email: string; name: string };
    return {
      id: `user-${Date.now()}`,
      email,
      name,
      createdAt: new Date().toISOString(),
    };
  },

  '/api/users/:id': () => {
    return {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };
  },

  // Post API
  '/api/posts': (body) => {
    const { platform, content, image, scheduledAt } = body as {
      platform: string;
      content: string;
      image?: string;
      scheduledAt?: string;
    };
    return {
      id: `post-${Date.now()}`,
      platform,
      content,
      image,
      status: 'scheduled',
      scheduledAt: scheduledAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  },

  '/api/posts/:id/publish': () => {
    return {
      id: 'post-123',
      platform: 'instagram',
      content: 'Test post content',
      status: 'published',
      publishedAt: new Date().toISOString(),
    };
  },
};

/**
 * Parse URL and extract path parameters
 */
function parsePath(url: string): { path: string; params: Record<string, string> } {
  const urlObj = new URL(url, `http://localhost:${PORT}`);
  let path = urlObj.pathname;
  const params: Record<string, string> = {};

  // Handle path parameters like :id
  for (const [key, value] of Object.entries(mockHandlers)) {
    if (key.includes(':')) {
      const paramKey = key.split('/').pop()?.replace(':', '') || '';
      const basePath = key.replace(`:${paramKey}`, '');
      if (path.startsWith(basePath) && basePath.length > 0) {
        const id = path.replace(basePath, '').replace('/', '');
        if (id) {
          params[paramKey] = id;
          path = key;
          break;
        }
      }
    }
  }

  return { path, params };
}

/**
 * Create HTTP request handler
 */
function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  const { path } = parsePath(req.url || '');
  const method = req.method || 'GET';

  console.log(`[Mock Server] ${method} ${path}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Get handler
  const handler = mockHandlers[path];
  
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path }));
    return;
  }

  // Read body
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      const parsedBody = body ? JSON.parse(body) : {};
      const response = handler(parsedBody);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: String(error) }));
    }
  });
}

/**
 * Start the mock server
 */
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              Mock API Server for Pact Testing                ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                    ║
║                                                              ║
║  Available endpoints:                                        ║
║  - POST /api/gemini/caption                                   ║
║  - POST /api/gemini/reply                                     ║
║  - POST /api/webhooks                                         ║
║  - POST /api/webhooks/:id/rotate                              ║
║  - POST /api/users                                            ║
║  - GET  /api/users/:id                                        ║
║  - POST /api/posts                                            ║
║  - POST /api/posts/:id/publish                                ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down mock server...');
  server.close(() => {
    console.log('Mock server stopped');
    process.exit(0);
  });
});

export default server;
