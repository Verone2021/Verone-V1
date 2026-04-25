/**
 * Packlink Webhook Event Handler
 * Date: 2025-11-12
 */

import type { PacklinkWebhookEvent } from './types';

export type WebhookEventHandler = (
  event: PacklinkWebhookEvent
) => Promise<void>;

/**
 * Webhook Event Handlers Registry
 */
const eventHandlers = new Map<string, WebhookEventHandler[]>();

/**
 * Register handler for specific event type
 */
export function onWebhookEvent(
  eventName: string,
  handler: WebhookEventHandler
): void {
  if (!eventHandlers.has(eventName)) {
    eventHandlers.set(eventName, []);
  }
  eventHandlers.get(eventName)!.push(handler);
}

/**
 * Process webhook event
 */
export async function processWebhookEvent(
  event: PacklinkWebhookEvent
): Promise<void> {
  const handlers = eventHandlers.get(event.name) ?? [];

  // Execute all handlers in parallel
  await Promise.all(handlers.map(handler => handler(event)));
}

/**
 * Verify webhook signature (if secret configured)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // TODO: Implement HMAC verification when Packlink docs available
  // For now, just check signature exists
  return signature.length > 0;
}

/**
 * Parse webhook payload
 */
export function parseWebhookPayload(body: string): PacklinkWebhookEvent {
  try {
    return JSON.parse(body) as PacklinkWebhookEvent;
  } catch (error) {
    throw new Error(`Invalid webhook payload: ${error}`);
  }
}
