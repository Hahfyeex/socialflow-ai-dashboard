/**
 * Provider Contract Tests using Pact
 * 
 * These tests verify that the backend API satisfies all consumer contracts.
 * The provider (backend) verifies that it correctly handles all requests
 * defined by the consumers (frontend).
 * 
 * Run with: npm run test:pact:provider
 */

import { Verifier } from '@pact-foundation/pact';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// API Configuration
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || '3000';
const PACT_BROKER_URL = process.env.PACT_BROKER_URL || 'http://localhost:9292';

// Provider name
const PROVIDER_NAME = 'socialflow-api';
// Consumer name
const CONSUMER_NAME = 'socialflow-frontend';

describe('Provider Contract Verification', () => {
  let verifier: Verifier;

  beforeAll(() => {
    verifier = new Verifier({
      provider: PROVIDER_NAME,
      providerBaseUrl: `http://${API_HOST}:${API_PORT}`,
      brokerUrl: PACT_BROKER_URL,
      publishVerificationResult: true,
      providerVersion: '1.0.0',
    });
  });

  it('should verify all consumer contracts', async () => {
    // This will verify that the provider satisfies all contracts
    // published by consumers to the Pact broker
    
    try {
      const result = await verifier.verify();
      console.log('Contract verification result:', result);
      expect(result).toBeDefined();
    } catch (error) {
      console.error('Contract verification failed:', error);
      throw error;
    }
  });
});

/**
 * Verification Options for CI Integration
 */
export const verificationOptions = {
  provider: PROVIDER_NAME,
  providerBaseUrl: `http://${API_HOST}:${API_PORT}`,
  brokerUrl: PACT_BROKER_URL,
  publishVerificationResult: true,
  providerVersion: process.env.GIT_COMMIT_SHA || '1.0.0',
  /* 
   * Enable the following in CI to publish results:
   * publishVerificationResult: true,
   * providerVersion: process.env.GIT_COMMIT_SHA || '1.0.0',
   */
};

/**
 * Run verification manually
 */
export async function verifyProviderContracts(): Promise<void> {
  const verifier = new Verifier(verificationOptions);
  await verifier.verify();
}