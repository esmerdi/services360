/**
 * Payment Provider Integration - Agnóstic Handler
 * Supports: Hotmart, Stripe (future)
 * 
 * Usage:
 * - Hotmart webhook hits /api/payments/hotmart
 * - Validate signature + extract transaction data
 * - Call activate_pro_membership RPC
 * - Send welcome email with temp password
 */

import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

type JsonMap = Record<string, unknown>;

interface HotmartWebhookPayload {
  type?: string;
  data?: {
    id?: string;
    transaction_id?: string;
    price?: number;
    currency?: string;
    product_id?: string;
    status?: string;
    customer?: {
      email?: string;
    };
  };
}

interface StripeWebhookPayload {
  id?: string;
  type?: string;
  data?: {
    object?: {
      amount?: number;
      currency?: string;
      customer?: string;
      receipt_email?: string;
      status?: string;
      billing_details?: {
        email?: string;
      };
      metadata?: {
        email?: string;
      };
      plan?: {
        amount?: number;
      };
    };
  };
}

interface PaymentMetadata extends JsonMap {
  userId?: string;
}

export interface PaymentWebhookPayload {
  provider: 'hotmart' | 'stripe';
  eventType: string;
  externalId: string;
  userEmail: string;
  amount: number;
  currency: string;
  metadata: PaymentMetadata;
}

/**
 * Hotmart webhook signature validation
 * Hotmart sends X-Hotmart-Signature header with HMAC-SHA256
 */
export function validateHotmartSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return hash === signature;
}

/**
 * Stripe webhook signature validation
 * Stripe uses similar approach with X-Stripe-Signature
 */
export function validateStripeSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const headerParts = signature.split(',');
  const timestamp = headerParts.find((part) => part.startsWith('t='))?.slice(2);
  const sig = headerParts.find((part) => part.startsWith('v1='))?.slice(3);

  if (!timestamp || !sig) {
    return false;
  }

  const signedContent = `${timestamp}.${body}`;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');
  
  return hash === sig;
}

/**
 * Extract payment data from Hotmart webhook
 */
export function parseHotmartWebhook(payload: HotmartWebhookPayload): PaymentWebhookPayload {
  return {
    provider: 'hotmart',
    eventType: payload.type || '',
    externalId: payload.data?.id || payload.data?.transaction_id || '',
    userEmail: payload.data?.customer?.email || '',
    amount: payload.data?.price || 0,
    currency: payload.data?.currency || 'USD',
    metadata: {
      hotmartTransactionId: payload.data?.transaction_id,
      hotmartProductId: payload.data?.product_id,
      status: payload.data?.status,
    },
  };
}

/**
 * Extract payment data from Stripe webhook
 */
export function parseStripeWebhook(payload: StripeWebhookPayload): PaymentWebhookPayload {
  const event = payload;
  const eventObject = event.data?.object;
  let userEmail = '';
  let amount = 0;

  if (event.type === 'charge.succeeded') {
    userEmail = eventObject?.billing_details?.email || eventObject?.receipt_email || '';
    amount = (eventObject?.amount || 0) / 100; // Stripe uses cents
  } else if (event.type === 'customer.subscription.updated') {
    userEmail = eventObject?.metadata?.email || '';
    amount = (eventObject?.plan?.amount || 0) / 100;
  }

  return {
    provider: 'stripe',
    eventType: event.type || '',
    externalId: event.id || '',
    userEmail,
    amount,
    currency: eventObject?.currency || 'USD',
    metadata: {
      stripeEventId: event.id,
      stripeCustomerId: eventObject?.customer,
      status: eventObject?.status,
    },
  };
}

/**
 * Generate temporary password (safe, complex)
 * Returns 12-char: 8 alphanumeric + 4 special
 */
export function generateTempPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += special[Math.floor(Math.random() * special.length)];

  // Fill remaining 8 chars randomly
  const allChars = upper + lower + numbers + special;
  for (let i = 0; i < 8; i++) {
    pwd += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle
  return pwd
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Unified payment processor (provider-agnostic RPC caller)
 * Call this from your backend after webhook validation
 */
export async function processPaymentWebhook(
  supabaseClient: SupabaseClient,
  paymentData: PaymentWebhookPayload,
  planId: string
) {
  try {
    // Log webhook to database
    const { data: webhookLog, error: logError } = await supabaseClient.rpc(
      'log_payment_webhook',
      {
        p_provider: paymentData.provider,
        p_event_type: paymentData.eventType,
        p_external_id: paymentData.externalId,
        p_user_email: paymentData.userEmail,
        p_payload: paymentData.metadata,
      }
    );

    if (logError) {
      throw new Error(`Failed to log webhook: ${logError.message}`);
    }

    // Activate membership and get temp password
    const { data: activation, error: activationError } = await supabaseClient.rpc(
      'activate_pro_membership',
      {
        p_user_id: paymentData.metadata.userId, // Must be in metadata or fetched separately
        p_plan_id: planId,
        p_provider: paymentData.provider,
        p_external_id: paymentData.externalId,
        p_metadata: paymentData.metadata,
      }
    );

    if (activationError) {
      throw new Error(`Failed to activate membership: ${activationError.message}`);
    }

    return {
      success: true,
      webhookId: webhookLog?.webhook_id,
      subscriptionId: activation?.subscription_id,
      userEmail: activation?.email,
    };
  } catch (error) {
    console.error('Payment webhook processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
