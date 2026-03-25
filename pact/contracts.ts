/**
 * Contract Definitions for Consumer-Driven Contract Testing
 * 
 * This file defines the expected API contracts between the Frontend (consumer)
 * and Backend (provider). These contracts are used by Pact to verify that
 * changes in the backend don't break the frontend.
 * 
 * Usage:
 * - Consumer: Import these contracts to understand expected API responses
 * - Provider: Use these contracts to verify your API satisfies all consumers
 */

/**
 * API Base URL - Configure this for your environment
 */
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Consumer Name - Identifies this frontend in contract testing
 */
export const CONSUMER_NAME = 'socialflow-frontend';

/**
 * Provider Name - Identifies the API in contract testing
 */
export const PROVIDER_NAME = 'socialflow-api';

// ============================================================================
// Gemini API Contracts
// ============================================================================

/**
 * Contract for caption generation endpoint
 */
export const captionGenerationContract = {
  description: 'Generate a social media caption',
  request: {
    method: 'POST',
    path: '/api/gemini/caption',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      topic: 'string',
      platform: 'string',
      tone: 'string',
    },
  },
  response: {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      caption: 'string',
    },
  },
};

/**
 * Contract for reply generation endpoint
 */
export const replyGenerationContract = {
  description: 'Generate quick replies for a conversation',
  request: {
    method: 'POST',
    path: '/api/gemini/reply',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      conversationHistory: 'string',
    },
  },
  response: {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      replies: ['string'],
    },
  },
};

// ============================================================================
// Webhook API Contracts
// ============================================================================

/**
 * Contract for creating a webhook configuration
 */
export const createWebhookContract = {
  description: 'Create a new webhook configuration',
  request: {
    method: 'POST',
    path: '/api/webhooks',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      url: 'string',
      secret: 'string',
    },
  },
  response: {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      id: 'string',
      url: 'string',
      isActive: 'boolean',
      createdAt: 'string',
      updatedAt: 'string',
      rotationInProgress: 'boolean',
    },
  },
};

/**
 * Contract for getting all webhook configurations
 */
export const getWebhooksContract = {
  description: 'Get all webhook configurations',
  request: {
    method: 'GET',
    path: '/api/webhooks',
  },
  response: {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: [
      {
        id: 'string',
        url: 'string',
        isActive: 'boolean',
        createdAt: 'string',
        updatedAt: 'string',
        rotationInProgress: 'boolean',
      },
    ],
  },
};

/**
 * Contract for starting secret rotation
 */
export const startSecretRotationContract = {
  description: 'Start webhook secret rotation',
  request: {
    method: 'POST',
    path: '/api/webhooks/{id}/rotate',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      newSecret: 'string',
    },
  },
  response: {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      id: 'string',
      url: 'string',
      secret: 'string',
      oldSecret: 'string',
      isActive: 'boolean',
      createdAt: 'string',
      updatedAt: 'string',
      rotationInProgress: 'boolean',
      rotationStartedAt: 'string',
    },
  },
};

// ============================================================================
// User API Contracts
// ============================================================================

/**
 * Contract for creating a user
 */
export const createUserContract = {
  description: 'Create a new user',
  request: {
    method: 'POST',
    path: '/api/users',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      email: 'string',
      name: 'string',
    },
  },
  response: {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      id: 'string',
      email: 'string',
      name: 'string',
      createdAt: 'string',
    },
  },
};

/**
 * Contract for getting a user by ID
 */
export const getUserContract = {
  description: 'Get a user by ID',
  request: {
    method: 'GET',
    path: '/api/users/{id}',
  },
  response: {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      id: 'string',
      email: 'string',
      name: 'string',
      createdAt: 'string',
    },
  },
};

// ============================================================================
// Post API Contracts
// ============================================================================

/**
 * Contract for creating a post
 */
export const createPostContract = {
  description: 'Create a new post',
  request: {
    method: 'POST',
    path: '/api/posts',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      platform: 'string',
      content: 'string',
      image: 'string',
      scheduledAt: 'string',
    },
  },
  response: {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      id: 'string',
      platform: 'string',
      content: 'string',
      image: 'string',
      status: 'string',
      scheduledAt: 'string',
      createdAt: 'string',
    },
  },
};

/**
 * Contract for publishing a post
 */
export const publishPostContract = {
  description: 'Publish a scheduled post',
  request: {
    method: 'POST',
    path: '/api/posts/{id}/publish',
  },
  response: {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      id: 'string',
      platform: 'string',
      content: 'string',
      status: 'string',
      publishedAt: 'string',
    },
  },
};

// ============================================================================
// Export all contracts
// ============================================================================

export const allContracts = {
  captionGeneration: captionGenerationContract,
  replyGeneration: replyGenerationContract,
  createWebhook: createWebhookContract,
  getWebhooks: getWebhooksContract,
  startSecretRotation: startSecretRotationContract,
  createUser: createUserContract,
  getUser: getUserContract,
  createPost: createPostContract,
  publishPost: publishPostContract,
};

/**
 * Get all contract names
 */
export const getContractNames = (): string[] => Object.keys(allContracts);

/**
 * Get a specific contract by name
 */
export const getContract = (name: string) => allContracts[name as keyof typeof allContracts];
