import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type JsonObject = Record<string, unknown>;

type HotmartPayload = {
  id?: string;
  type?: string;
  event?: string;
  data?: {
    id?: string;
    transaction_id?: string;
    status?: string;
    product_id?: string;
    customer?: { email?: string };
    buyer?: { email?: string };
    subscriber?: { email?: string };
  };
  status?: string;
};

function readHeader(req: any, name: string): string {
  const headerValue = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(headerValue)) return headerValue[0] ?? '';
  return typeof headerValue === 'string' ? headerValue : '';
}

async function readRawBody(req: any): Promise<string> {
  // Vercel pre-parses application/json bodies and exposes them via req.body.
  // When that happens the readable stream is already consumed, so we re-serialize.
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function validateHmac(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}

function normalizeEventType(payload: HotmartPayload): string {
  return String(payload.type || payload.event || payload.data?.status || payload.status || 'unknown');
}

function normalizeStatus(payload: HotmartPayload): string {
  return String(payload.data?.status || payload.status || '').toLowerCase();
}

function shouldActivateMembership(eventType: string, status: string): boolean {
  const evt = eventType.toLowerCase();
  if (status === 'approved' || status === 'completed' || status === 'complete') return true;
  return (
    evt.includes('approved') ||
    evt.includes('purchase_approved') ||
    evt.includes('order_approved') ||
    evt.includes('subscription_approved')
  );
}

function getEmail(payload: HotmartPayload): string {
  return String(
    payload.data?.customer?.email ||
    payload.data?.buyer?.email ||
    payload.data?.subscriber?.email ||
    ''
  ).trim().toLowerCase();
}

function getExternalId(payload: HotmartPayload): string {
  return String(
    payload.data?.transaction_id ||
    payload.data?.id ||
    payload.id ||
    ''
  );
}

function json(res: any, status: number, data: JsonObject) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hotmartHmacSecret = process.env.HOTMART_WEBHOOK_SECRET;
  const hotmartHottok = process.env.HOTMART_HOTTOK;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { ok: false, message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
  }

  let rawBody: string;
  let payload: HotmartPayload;

  // If Vercel pre-parsed the body it lands as req.body (object or string).
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object') {
    payload = req.body as HotmartPayload;
    rawBody = JSON.stringify(req.body);
  } else {
    rawBody = await readRawBody(req);
    try {
      payload = JSON.parse(rawBody) as HotmartPayload;
    } catch {
      return json(res, 400, { ok: false, message: 'Invalid JSON payload' });
    }
  }

  const signature = readHeader(req, 'x-hotmart-signature');
  const hottokHeader = readHeader(req, 'x-hotmart-hottok');

  let signatureVerified = false;
  if (hotmartHmacSecret) {
    signatureVerified = validateHmac(rawBody, signature, hotmartHmacSecret);
  } else if (hotmartHottok) {
    signatureVerified = hottokHeader === hotmartHottok;
  } else {
    // Allow bootstrapping in development when no verification secret is configured.
    signatureVerified = true;
  }

  const eventType = normalizeEventType(payload);
  const status = normalizeStatus(payload);
  const userEmail = getEmail(payload);
  const externalId = getExternalId(payload);

  if (!externalId) {
    return json(res, 400, { ok: false, message: 'Missing transaction identifier' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: webhookLog, error: logError } = await supabase.rpc('log_payment_webhook', {
    p_provider: 'hotmart',
    p_event_type: eventType,
    p_external_id: externalId,
    p_user_email: userEmail || null,
    p_payload: payload as unknown as JsonObject,
  });

  if (logError) {
    return json(res, 500, { ok: false, message: `Failed to log webhook: ${logError.message}` });
  }

  if (!signatureVerified) {
    return json(res, 401, {
      ok: false,
      message: 'Webhook signature validation failed',
      webhookId: webhookLog?.webhook_id,
    });
  }

  if (!shouldActivateMembership(eventType, status)) {
    return json(res, 200, {
      ok: true,
      processed: false,
      message: `Event ${eventType} ignored (status: ${status || 'n/a'})`,
      webhookId: webhookLog?.webhook_id,
    });
  }

  if (!userEmail) {
    return json(res, 400, {
      ok: false,
      message: 'Hotmart webhook is missing customer email',
      webhookId: webhookLog?.webhook_id,
    });
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .maybeSingle();

  if (userError || !userRow?.id) {
    return json(res, 404, {
      ok: false,
      message: `User not found for email ${userEmail}`,
      webhookId: webhookLog?.webhook_id,
    });
  }

  const { data: proPlan, error: planError } = await supabase
    .from('plans')
    .select('id, name')
    .eq('name', 'PRO')
    .maybeSingle();

  if (planError || !proPlan?.id) {
    return json(res, 500, {
      ok: false,
      message: 'PRO plan not found in database',
      webhookId: webhookLog?.webhook_id,
    });
  }

  const metadata: JsonObject = {
    hotmartEvent: eventType,
    hotmartStatus: status,
    hotmartProductId: payload.data?.product_id || null,
    hotmartTransactionId: payload.data?.transaction_id || payload.data?.id || payload.id || null,
    source: 'hotmart-webhook',
  };

  const { data: activation, error: activationError } = await supabase.rpc('activate_pro_membership', {
    p_user_id: userRow.id,
    p_plan_id: proPlan.id,
    p_provider: 'hotmart',
    p_external_id: externalId,
    p_metadata: metadata as unknown as JsonObject,
  });

  if (activationError) {
    return json(res, 500, {
      ok: false,
      message: `Failed to activate membership: ${activationError.message}`,
      webhookId: webhookLog?.webhook_id,
    });
  }

  return json(res, 200, {
    ok: true,
    processed: true,
    message: 'Webhook processed and membership activated',
    webhookId: webhookLog?.webhook_id,
    activation,
   });
 }
