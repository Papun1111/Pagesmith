'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, Send, Copy, Check, Trash2, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  Markdown renderer for AI responses                                */
/* ------------------------------------------------------------------ */

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;
          return !isInline && match ? (
            <div className="relative group rounded-md overflow-hidden my-3">
              <div className="absolute top-0 right-0 px-2 py-1 bg-black/50 text-white/50 text-[10px] font-mono rounded-bl-md uppercase">
                {match[1]}
              </div>
              <SyntaxHighlighter
                style={oneDark as any}
                language={match[1]}
                PreTag="div"
                {...(props as any)}
                className="!m-0 text-[12px] no-scrollbar"
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code
              className={cn(
                'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]',
                className
              )}
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ------------------------------------------------------------------ */
/*  CopyButton                                                         */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 px-2 text-[10px] uppercase tracking-wider font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-400"
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3" /> Copied
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <Copy className="h-3 w-3" /> Copy
        </span>
      )}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  ChatBubble                                                         */
/* ------------------------------------------------------------------ */

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
      className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-1',
          isUser
            ? 'bg-indigo-600 text-white'
            : isError
              ? 'bg-red-500 text-white'
              : 'bg-slate-800 dark:bg-white text-white dark:text-black'
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : isError ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'group relative max-w-[85%] min-w-0',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : isError
                ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-300 rounded-tl-sm'
                : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <MarkdownContent content={message.content} />
            </div>
          )}

          {/* Copy button for assistant messages */}
          {message.role === 'assistant' && (
            <div className="flex justify-end mt-2 -mb-1">
              <CopyButton text={message.content} />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p
          className={cn(
            'text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading dots                                                       */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-2.5"
    >
      <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center bg-slate-800 dark:bg-white text-white dark:text-black">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut' as const,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
      >
        <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 p-4 rounded-2xl mb-4">
          <Sparkles className="h-8 w-8" />
        </div>
      </motion.div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
        AI Assistant
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px]">
        Ask me to write code, brainstorm ideas, or explain concepts
      </p>
    </div>
  );
}

/* ================================================================== */
/*  AIAssistantPanel                                                   */
/* ================================================================== */

export function AIAssistantPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---- Auto-scroll to bottom on new messages ---- */
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  /* ---- Auto-resize textarea ---- */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize: reset then set to scrollHeight, capped at 120px
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  /* ---- Submit handler ---- */
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          message: `Request failed with status: ${res.status}`,
        }));
        throw new Error(
          errorData.message || 'The AI assistant failed to respond.'
        );
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(
          'Received an invalid response from the AI assistant.'
        );
      }
    } catch (err: unknown) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'error',
        content:
          err instanceof Error
            ? err.message
            : 'An unknown error occurred.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Refocus the input
      textareaRef.current?.focus();
    }
  };

  /* ---- Enter to send, Shift+Enter for newline ---- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /* ---- Clear chat ---- */
  const handleClearChat = () => {
    setMessages([]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/50 dark:bg-black/30 text-slate-900 dark:text-slate-100 transition-colors duration-300 border-l border-slate-200 dark:border-white/10 backdrop-blur-xl">
      {/* ---- Header ---- */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-white/10 bg-transparent flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 p-1.5 rounded-lg">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              AI Assistant
            </h2>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              {messages.length > 0
                ? `${messages.filter((m) => m.role === 'user').length} messages`
                : 'Brainstorm • Code'}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="h-7 px-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* ---- Messages Area (scrollable) ---- */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 no-scrollbar"
      >
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            <AnimatePresence>
              {isLoading && <TypingIndicator />}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ---- Input Area (pinned to bottom) ---- */}
      <div className="flex-shrink-0 p-3 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-md">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI anything..."
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl',
                'focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50',
                'resize-none px-3.5 py-2.5 text-sm shadow-sm transition-all',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                'outline-none min-h-[40px] max-h-[120px]'
              )}
              style={{ height: 'auto' }}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className={cn(
              'flex-shrink-0 h-10 w-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700',
              'dark:bg-indigo-500 dark:hover:bg-indigo-600',
              'transition-all shadow-sm active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 px-1">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[9px] font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[9px] font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}