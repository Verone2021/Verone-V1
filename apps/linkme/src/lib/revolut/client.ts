/**
 * Client API Revolut Merchant
 * Documentation: https://developer.revolut.com/docs/merchant/orders
 */

import * as crypto from 'crypto';
import type {
  RevolutConfig,
  RevolutEnvironment,
  RevolutOrder,
  RevolutOrderRequest,
  CreateOrderResponse,
} from './types';

const API_URLS: Record<RevolutEnvironment, string> = {
  sandbox: 'https://sandbox-merchant.revolut.com/api/orders',
  prod: 'https://merchant.revolut.com/api/orders',
};

/**
 * Récupère la configuration Revolut depuis les variables d'environnement
 */
export function getRevolutConfig(): RevolutConfig {
  const apiKey = process.env.REVOLUT_API_KEY;
  const publicKey = process.env.REVOLUT_PUBLIC_KEY || process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_KEY;
  const environment = (process.env.REVOLUT_ENVIRONMENT || 'sandbox') as RevolutEnvironment;
  const webhookSecret = process.env.REVOLUT_WEBHOOK_SECRET;
  const merchantId = process.env.REVOLUT_MERCHANT_ID;

  if (!apiKey) {
    throw new Error('REVOLUT_API_KEY is not configured');
  }

  if (!publicKey) {
    throw new Error('REVOLUT_PUBLIC_KEY or NEXT_PUBLIC_REVOLUT_PUBLIC_KEY is not configured');
  }

  return {
    apiKey,
    publicKey,
    merchantId,
    environment,
    webhookSecret,
  };
}

/**
 * Crée une commande Revolut pour le paiement
 */
export async function createRevolutOrder(
  request: RevolutOrderRequest
): Promise<CreateOrderResponse> {
  try {
    const config = getRevolutConfig();
    const apiUrl = API_URLS[config.environment];

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        merchant_order_ext_ref: request.merchant_order_ext_ref,
        customer_email: request.customer_email,
        capture_mode: request.capture_mode || 'automatic',
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Revolut API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return {
        success: false,
        error: errorData.message || `API error: ${response.status} ${response.statusText}`,
      };
    }

    const order: RevolutOrder = await response.json();

    return {
      success: true,
      order,
      token: order.token, // Token public pour le SDK frontend
    };
  } catch (error) {
    console.error('Failed to create Revolut order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Récupère une commande Revolut par son ID
 */
export async function getRevolutOrder(orderId: string): Promise<RevolutOrder | null> {
  try {
    const config = getRevolutConfig();
    const baseUrl = API_URLS[config.environment].replace('/orders', '');

    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to get Revolut order:', response.status, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Revolut order:', error);
    return null;
  }
}

/**
 * Annule une commande Revolut non capturée
 */
export async function cancelRevolutOrder(orderId: string): Promise<boolean> {
  try {
    const config = getRevolutConfig();
    const baseUrl = API_URLS[config.environment].replace('/orders', '');

    const response = await fetch(`${baseUrl}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Accept': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error cancelling Revolut order:', error);
    return false;
  }
}

/**
 * Effectue un remboursement sur une commande Revolut
 */
export async function refundRevolutOrder(
  orderId: string,
  amount: number,
  currency: string,
  description?: string
): Promise<boolean> {
  try {
    const config = getRevolutConfig();
    const baseUrl = API_URLS[config.environment].replace('/orders', '');

    const response = await fetch(`${baseUrl}/orders/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        description,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error refunding Revolut order:', error);
    return false;
  }
}

/**
 * Vérifie la signature d'un webhook Revolut
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Revolut utilise HMAC-SHA256 pour signer les webhooks
  // La signature est dans le header 'Revolut-Signature'
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Comparaison sécurisée en temps constant
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
