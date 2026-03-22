-- Migration: 009_messages.sql
-- Adds real-time chat between client and provider for accepted service requests

CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID        NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id  UUID        NOT NULL REFERENCES public.users(id)            ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  read_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_request_created
  ON public.messages(request_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages(sender_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants (client or provider of the request) can read messages
CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = messages.request_id
        AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

-- Participants can insert messages (sender must be themselves)
CREATE POLICY "messages_insert_participants" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = messages.request_id
        AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

-- Recipient can mark messages as read (update read_at only)
CREATE POLICY "messages_update_read_at" ON public.messages
  FOR UPDATE USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = messages.request_id
        AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

-- Enable Supabase Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
