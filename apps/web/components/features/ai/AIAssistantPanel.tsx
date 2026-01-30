'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, AlertTriangle, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "motion/react";

export function AIAssistantPanel() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col bg-[#F0F0F0] dark:bg-[#111111] text-[#111111] dark:text-white transition-colors duration-300 border-l-2 border-black dark:border-white/20">
        
        {/* Header Section */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b-2 border-black dark:border-white/20 bg-white dark:bg-[#1a1a1a]">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-black dark:bg-white text-white dark:text-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                    <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter">
                    AI Assistant
                </h2>
            </div>
            <p className="text-xs font-bold text-black/60 dark:text-white/60 uppercase tracking-wide">
                Brainstorm • Code • Create
            </p>
        </div>
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-grow min-h-0 relative">
            
            {/* Response Area */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-[#F0F0F0] dark:bg-[#111111] custom-scrollbar">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <Skeleton className="w-3/4 h-4 bg-gray-300 dark:bg-neutral-800 rounded-none" />
                            <Skeleton className="w-full h-4 bg-gray-300 dark:bg-neutral-800 rounded-none" />
                            <Skeleton className="w-5/6 h-4 bg-gray-300 dark:bg-neutral-800 rounded-none" />
                        </motion.div>
                    ) : error ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-100 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500/50 p-4 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]"
                        >
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-black mb-2 uppercase text-xs tracking-wider">
                                <AlertTriangle className="h-4 w-4" />
                                Error
                            </div>
                            <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
                        </motion.div>
                    ) : response ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="prose prose-sm dark:prose-invert max-w-none"
                        >
                            <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                <p className="whitespace-pre-wrap font-medium">{response}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
                            <Sparkles className="h-12 w-12 mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">Ready when you are</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#1a1a1a] border-t-2 border-black dark:border-white/20">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="relative group">
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ask me anything..."
                            rows={3}
                            disabled={isLoading}
                            className="bg-[#F0F0F0] dark:bg-[#111111] border-2 border-black dark:border-white/20 rounded-none focus:ring-0 focus:border-black dark:focus:border-white focus-visible:ring-0 resize-none p-3 font-medium placeholder:text-black/40 dark:placeholder:text-white/40 transition-all group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        disabled={isLoading || !prompt.trim()} 
                        className={cn(
                            "w-full bg-black text-white dark:bg-white dark:text-black rounded-none hover:bg-black/90 dark:hover:bg-white/90 font-black uppercase tracking-wider py-6 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
                            isLoading && "opacity-80 cursor-wait"
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