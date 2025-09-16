'use client';

import { useState } from 'react';
import { Sparkles, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * A panel component that provides a user interface for interacting with the Gemini AI.
 * It allows users to send prompts and view the generated responses.
 */
export function AIAssistantPanel() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the form submission to the frontend API route.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return; // Don't submit empty prompts

    setIsLoading(true);
    setResponse(''); // Clear previous response

    try {
      // Call the frontend API route, not the backend directly.
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to get a response from the AI.');
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (error: unknown) {
      console.error("AI Assistant Error:", error as unknown as string);
      setResponse(`Error: ${error as unknown as string}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span>AI Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask the AI to brainstorm ideas, explain code, or generate a to-do list..."
            className="w-full resize-none"
            rows={4}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !prompt.trim()} className="w-full">
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Response'
            )}
          </Button>
        </form>
        
        <div className="flex-grow rounded-md border bg-muted/50 p-4">
          <ScrollArea className="h-full">
            {response ? (
              <pre className="text-sm whitespace-pre-wrap font-sans">{response}</pre>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-8">
                Your AI-generated response will appear here.
              </p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
