'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { Sparkles, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// NOTE: To use the 'Poppins' font, please add the following to your HTML head:
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
// <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap" rel="stylesheet">

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
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col bg-[#F0F0F0] text-[#111111] p-3 sm:p-4">
        <div className="flex-shrink-0">
            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                AI Assistant
            </h2>
            <p className="text-sm text-black/70 mt-1">
                Ask me to brainstorm, write code, or generate ideas.
            </p>
        </div>
        
        <div className="flex flex-col flex-grow gap-4 mt-4 min-h-0"> {/* Added min-h-0 for flexbox safety in some browsers */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Explain React hooks in simple terms..."
                    rows={4}
                    disabled={isLoading}
                    className="bg-white border-2 border-black rounded-none focus:ring-0 focus:border-black"
                />
                <Button type="submit" disabled={isLoading} className="bg-black text-white rounded-none hover:bg-black/80 font-bold py-3 sm:py-4">
                    {isLoading ? 'Generating...' : 'Generate Response'}
                </Button>
            </form>

            <div className="flex-grow overflow-y-auto rounded-none border-2 border-black p-3 sm:p-4 bg-white">
                {isLoading && <Skeleton className="w-full h-24 bg-gray-300" />}
                {error && (
                    <div className="text-red-700 flex items-start gap-2 border border-red-500 bg-red-100 p-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-1" />
                        <div>
                            <p className="font-bold text-sm">An error occurred:</p>
                            <p className="text-xs">{error}</p>
                        </div>
                    </div>
                )}
                {response && <p className="text-sm whitespace-pre-wrap">{response}</p>}
                {!isLoading && !error && !response && (
                    <p className="text-sm text-black/60">Your AI-generated content will appear here.</p>
                )}
            </div>
        </div>
    </div>
  );
}