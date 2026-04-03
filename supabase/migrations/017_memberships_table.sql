-- =============================================
-- Services 360 - Memberships Table
-- =============================================
-- Tracks user PRO plan subscriptions with payment provider integration.
-- Supports multiple providers (Hotmart, Stripe, etc.) via 'provider' field.

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('hotmart', 'stripe', 'manual')),
  external_id TEXT NOT NULL, -- Hotmart transactionId, Stripe subscriptionId, etc.
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_validation', 'expired', 'cancelled')),
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE, -- NULL = indefinite (or set to renewal date)
  auto_renew BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- Store provider-specific data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_active_membership UNIQUE (user_id) WHERE status = 'active'
);

CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_provider_external_id ON public.memberships(provider, external_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can view all memberships (optional)
CREATE POLICY "Admin can view all memberships"
  ON public.memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role (backend) can insert/update memberships
CREATE POLICY "Service role manages webhooks"
  ON public.memberships FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role updates memberships"
  ON public.memberships FOR UPDATE
  USING (true);

-- =============================================
-- Trigger: Update memberships.updated_at on change
-- =============================================
CREATE OR REPLACE FUNCTION public.update_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER membership_updated_at
AFTER UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_memberships_updated_at();

-- =============================================
-- Trigger: Sync subscription_plan to user_profiles when membership changes
-- =============================================
CREATE OR REPLACE FUNCTION public.sync_membership_to_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET subscription_plan = CASE 
    WHEN NEW.status = 'active' THEN 'pro'
    ELSE 'free'
  END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER membership_sync_profile
AFTER INSERT OR UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.sync_membership_to_user_profile();

-- =============================================
-- RPC: Activate membership and send temp password
-- =============================================
CREATE OR REPLACE FUNCTION public.activate_pro_membership(
  p_user_id UUID,
  p_plan_id UUID,
  p_provider TEXT,
  p_external_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_temp_password TEXT;
  v_user_email TEXT;
  v_membership_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_plan_id IS NULL OR p_provider IS NULL OR p_external_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Missing required parameters');
  END IF;

  -- Generate temporary password (12 chars: 8 alphanumeric + 4 symbols)
  v_temp_password := substr(md5(random()::text || clock_timestamp()::text), 1, 8) ||
                     substr('!@#$%^&*', (random() * 8)::int + 1, 1) ||
                     substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (random() * 26)::int + 1, 1);

  -- Get user email
  SELECT email FROM auth.users WHERE id = p_user_id INTO v_user_email;
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Create or update membership
  INSERT INTO public.memberships (user_id, plan_id, provider, external_id, status, metadata)
  VALUES (p_user_id, p_plan_id, p_provider, p_external_id, 'active', p_metadata)
  ON CONFLICT (user_id) DO UPDATE
  SET status = 'active', plan_id = p_plan_id, provider = p_provider, 
      external_id = p_external_id, metadata = p_metadata, updated_at = now()
  RETURNING id INTO v_membership_id;

  -- Update user subscription_plan in user_profiles
  UPDATE public.user_profiles 
  SET subscription_plan = 'pro', updated_at = now()
  WHERE id = p_user_id;

  -- Return success with temp password (frontend must send temp pwd via secure email service)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pro membership activated',
    'membership_id', v_membership_id,
    'email', v_user_email,
    'temp_password', v_temp_password
  );
END;
$$;

-- Grant execute to authenticated and service role
GRANT EXECUTE ON FUNCTION public.activate_pro_membership(UUID, UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;
