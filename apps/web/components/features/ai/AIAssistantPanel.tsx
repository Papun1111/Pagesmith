'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, AlertTriangle, Send, Copy, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function AIAssistantPanel() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(response).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          message: `Request failed with status: ${res.status}`,
        }));
        throw new Error(errorData.message || 'The AI assistant failed to respond.');
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setResponse(data.response);
      } else {
        const errorText = await res.text();
        console.error("Received non-JSON response from AI API:", errorText);
        throw new Error('Received an invalid response from the AI assistant. Check the server logs.');
      }

    } catch (err: unknown) {
      if(err instanceof Error){
        console.error("AI Assistant Error:", err);
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/50 dark:bg-black/30 text-slate-900 dark:text-slate-100 transition-colors duration-300 border-l border-slate-200 dark:border-white/10 backdrop-blur-xl">
        
        {/* Header Section */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 p-1.5 rounded-lg">
                    <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">AI Assistant</h2>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Brainstorm • Code</p>
                </div>
            </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-grow min-h-0 relative">
            
            {/* Response Area */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-5 no-scrollbar">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <Skeleton className="w-3/4 h-4 rounded-full" />
                            <Skeleton className="w-full h-4 rounded-full" />
                            <Skeleton className="w-5/6 h-4 rounded-full" />
                        </motion.div>
                    ) : error ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-xl shadow-sm"
                        >
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold mb-1.5 text-xs uppercase tracking-wider">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Error
                            </div>
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </motion.div>
                    ) : response ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="prose prose-sm dark:prose-invert max-w-none relative group"
                        >
                            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 pt-8 rounded-xl shadow-sm overflow-x-auto relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 h-6 px-2 text-[10px] uppercase tracking-wider font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-400"
                                >
                                    {copied ? <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Copied</span> : <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</span>}
                                </Button>
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        code({ node, inline, className, children, ...props }: any) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline && match ? (
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
                                                <code className={cn("bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]", className)} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {response}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-8">
                            <Sparkles className="h-10 w-10 mb-3" />
                            <p className="text-xs font-medium uppercase tracking-widest">Ready to help</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                    <div className="relative group">
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ask the AI (e.g., 'Write a Python script...')"
                            rows={3}
                            disabled={isLoading}
                            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none p-3.5 text-sm shadow-sm transition-all"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        disabled={isLoading || !prompt.trim()} 
                        className={cn(
                            "w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium py-5 transition-all shadow-sm active:scale-[0.98]",
                            isLoading && "opacity-70 cursor-wait"
                        )}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">Generating...</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Generate <Send className="h-4 w-4" />
                            </span>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    </div>
  );
}