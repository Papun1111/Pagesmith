'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
        const errorText = await res.text();
        throw new Error(errorText || 'The AI assistant failed to respond.');
      }

      // FIX: Check the Content-Type header before attempting to parse as JSON.
      // This prevents the "Unexpected token '<'" error if we receive an HTML page.
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setResponse(data.response);
      } else {
        // If the response is not JSON, something is wrong with the API gateway.
        const errorText = await res.text();
        console.error("Received non-JSON response from AI API:", errorText);
        throw new Error('Received an invalid response from the AI assistant.');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col border-0 shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Ask me to brainstorm, write code, or generate ideas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Explain React hooks in simple terms..."
            rows={4}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Response'}
          </Button>
        </form>

        <div className="flex-grow overflow-y-auto rounded-md border p-4 bg-gray-50 dark:bg-gray-800/50">
          {isLoading && <Skeleton className="w-full h-24" />}
          {error && (
            <div className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {response && <p className="text-sm whitespace-pre-wrap">{response}</p>}
          {!isLoading && !error && !response && (
            <p className="text-sm text-muted-foreground">Your AI-generated content will appear here.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

