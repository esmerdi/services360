import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import type { Message } from '../../types';
import { formatDateTime } from '../../utils/helpers';

interface ChatWindowProps {
  requestId: string;
  currentUserId: string;
  otherUserName: string | null;
  otherUserAvatar: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatWindow({
  requestId,
  currentUserId,
  otherUserName,
  otherUserAvatar,
  isOpen,
  onClose,
}: ChatWindowProps) {
  const { t, language } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const markRead = useCallback(async () => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .neq('sender_id', currentUserId)
      .is('read_at', null);
  }, [requestId, currentUserId]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
  }, [requestId]);

  // Load messages + subscribe to realtime when open
  useEffect(() => {
    if (!isOpen) return;

    void loadMessages().then(() => markRead());

    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          if (incoming.sender_id !== currentUserId) {
            void markRead();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isOpen, requestId, currentUserId, loadMessages, markRead]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-resize textarea
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
    }
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: currentUserId,
      content: trimmed,
    });
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding panel from the right */}
      <div className="relative z-10 ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <UserAvatar
            avatarUrl={otherUserAvatar}
            name={otherUserName ?? '?'}
            className="h-9 w-9 flex-shrink-0 text-xs"
            fallbackClassName="text-xs font-semibold text-white"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">
              {otherUserName ?? t('chat.unknownUser')}
            </p>
            <p className="text-xs text-emerald-500">{t('chat.chatSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages list */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-400">
              {t('chat.noMessagesYet')}
            </p>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                    isOwn
                      ? 'rounded-br-sm bg-blue-600 text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`mt-1 text-right text-[10px] ${
                      isOwn ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {formatDateTime(msg.created_at, language)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="flex items-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.messagePlaceholder')}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
            aria-label={t('chat.sendMessage')}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
