"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Eye, Edit3, Download } from "lucide-react";

import { useSocket } from "@/hooks/useSocket";
import { useDebounce } from "@/hooks/useDebounce";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorProps {
  canvasId: string;
  initialContent: string;
}

// Fixed interface to match ReactMarkdown's expected props
interface CodeBlockProps {
  children?: ReactNode;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Copy button component for code blocks
 */
function CopyButton({
  content,
}: {
  content: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 hover:bg-gray-700 border border-gray-600"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3 text-white" />
      )}
    </Button>
  );
}

/**
 * Enhanced code block component with copy functionality
 */
function CodeBlock({ children, className, ...rest }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const isInline = !match;
  // Safe conversion of children to string, handling undefined/null cases
  const content = String(children || "").replace(/\n$/, "");

  if (isInline) {
    return (
      <code
        {...rest}
        className="bg-gray-800 text-white px-2 py-1 rounded font-mono text-sm border border-gray-600"
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      {/* Language label */}
      {language && (
        <div className="absolute top-2 left-4 text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded-md z-10">
          {language}
        </div>
      )}

      {/* Copy button */}
      <CopyButton content={content} language={language} />

      {/* Code block */}
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || "text"}
        PreTag="div"
        className="rounded-lg border border-gray-600"
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          fontSize: "14px",
          lineHeight: "1.6",
          backgroundColor: "#1e1e1e",
          padding: "1rem",
          paddingTop: language ? "2.5rem" : "1rem",
          color: "#ffffff",
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

// Helper function to extract text content from ReactNode
function extractTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("");
  }
  if (node && typeof node === "object" && "props" in node) {
    const element = node as { props: { children?: ReactNode } };
    return extractTextContent(element.props.children);
  }
  return "";
}

/**
 * The main editor component for the canvas. It now uses the `useSocket` hook
 * to manage its real-time connection and provides syntax highlighting with
 * Notion-like editing experience.
 */
export function Editor({ canvasId, initialContent }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [previewOnly, setPreviewOnly] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use the custom hook to manage the socket connection.
  // This replaces all the manual connection logic.
  const { socket, isConnected } = useSocket(canvasId);

  // This ref is crucial to prevent the editor from sending content back to the
  // server that it just received (an "echo").
  const isLocalChange = useRef(false);
  const debouncedContent = useDebounce(content, 500);

  // Effect to listen for incoming content updates from other users.
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (newContent: string) => {
      // When we receive an update, we flag that it was not a local change.
      isLocalChange.current = false;
      setContent(newContent);
    };

    socket.on("canvas-updated", handleUpdate);

    // Clean up the event listener when the component unmounts or the socket changes.
    return () => {
      socket.off("canvas-updated", handleUpdate);
    };
  }, [socket]);

  // Effect to send local content updates to the server.
  useEffect(() => {
    // We only send an update if the connection is live, the socket exists,
    // and the change was made by the local user.
    if (isConnected && socket && isLocalChange.current) {
      socket.emit("canvas-update", { canvasId, content: debouncedContent });
      // Reset the flag after sending the update.
      isLocalChange.current = false;
    }
  }, [debouncedContent, canvasId, isConnected, socket]);

  // Notion-like shortcuts for quick formatting
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    // Handle Tab key for code blocks
    if (e.key === "Tab") {
      e.preventDefault();
      const beforeCursor = content.substring(0, selectionStart);
      const afterCursor = content.substring(selectionEnd);
      const newContent = beforeCursor + "  " + afterCursor;
      setContent(newContent);
      isLocalChange.current = true;

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
      return;
    }

    // Handle Enter key for auto-formatting
    if (e.key === "Enter") {
      const beforeCursor = content.substring(0, selectionStart);
      const lines = beforeCursor.split("\n");
      const currentLine = lines[lines.length - 1];

      // Auto-continue lists
      if (currentLine.match(/^\s*[\*\-\+]\s/)) {
        e.preventDefault();
        const match = currentLine.match(/^(\s*)([\*\-\+]\s)/);
        if (match) {
          const indent = match[1];
          const bullet = match[2];
          insertText(`\n${indent}${bullet}`);
        }
        return;
      }

      // Auto-continue numbered lists
      if (currentLine.match(/^\s*\d+\.\s/)) {
        e.preventDefault();
        const match = currentLine.match(/^(\s*)(\d+)(\.\s)/);
        if (match) {
          const indent = match[1];
          const nextNum = parseInt(match[2]) + 1;
          insertText(`\n${indent}${nextNum}. `);
        }
        return;
      }
    }

    // Quick shortcuts with Cmd/Ctrl
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          wrapSelection("**", "**");
          break;
        case "i":
          e.preventDefault();
          wrapSelection("*", "*");
          break;
        case "k":
          e.preventDefault();
          wrapSelection("[", "](url)");
          break;
      }
    }
  };

  // Handle special command replacements - FIXED VERSION
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const newValue = textarea.value;
    const { selectionStart } = textarea;

    // Check if we just typed a space after a slash command
    if (newValue[selectionStart - 1] === " ") {
      const beforeCursor = newValue.substring(0, selectionStart - 1);
      const afterCursor = newValue.substring(selectionStart);
      const words = beforeCursor.split(/\s/);
      const lastWord = words[words.length - 1];

      if (lastWord.startsWith("/")) {
        const command = lastWord.substring(1).toLowerCase();
        let replacement = "";
        let cursorOffset = 0;

        switch (command) {
          case "code":
            replacement = "```\n// Add your code here\n```";
            cursorOffset = 4; // Position cursor after first newline
            break;
          case "js":
          case "javascript":
            replacement =
              "```javascript\n// Add your JavaScript code here\nconsole.log('Hello, World!');\n```";
            cursorOffset = 13; // Position cursor after "```javascript\n"
            break;
          case "ts":
          case "typescript":
            replacement =
              "```typescript\n// Add your TypeScript code here\ninterface Example {\n  message: string;\n}\n\nconst example: Example = {\n  message: 'Hello, World!'\n};\n```";
            cursorOffset = 14; // Position cursor after "```typescript\n"
            break;
          case "py":
          case "python":
            replacement =
              "```python\n# Add your Python code here\ndef hello_world():\n    print('Hello, World!')\n\nhello_world()\n```";
            cursorOffset = 10; // Position cursor after "```python\n"
            break;
          case "md":
          case "markdown":
            replacement =
              "```markdown\n# Add your Markdown content here\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2\n```";
            cursorOffset = 12; // Position cursor after "```markdown\n"
            break;
          case "json":
            replacement =
              '```json\n{\n  "key": "value",\n  "number": 123,\n  "boolean": true\n}\n```';
            cursorOffset = 8; // Position cursor after "```json\n"
            break;
          case "h1":
            replacement = "# ";
            cursorOffset = 2;
            break;
          case "h2":
            replacement = "## ";
            cursorOffset = 3;
            break;
          case "h3":
            replacement = "### ";
            cursorOffset = 4;
            break;
          case "quote":
            replacement = "> ";
            cursorOffset = 2;
            break;
          case "todo":
            replacement = "- [ ] ";
            cursorOffset = 6;
            break;
          case "table":
            replacement =
              "| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |";
            cursorOffset = 12; // Position cursor at first header
            break;
        }

        if (replacement) {
          e.preventDefault();
          const newContent =
            beforeCursor.replace(lastWord, replacement) + afterCursor;
          setContent(newContent);
          isLocalChange.current = true;

          setTimeout(() => {
            const newPosition =
              selectionStart - lastWord.length - 1 + cursorOffset;
            textarea.selectionStart = textarea.selectionEnd = newPosition;
            textarea.focus();
          }, 0);
          return;
        }
      }
    }

    // Update content normally if no command was triggered
    setContent(newValue);
    isLocalChange.current = true;
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const newContent =
      content.substring(0, selectionStart) +
      text +
      content.substring(selectionEnd);
    setContent(newContent);
    isLocalChange.current = true;

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd =
        selectionStart + text.length;
      textarea.focus();
    }, 0);
  };

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = content.substring(selectionStart, selectionEnd);
    const newText = before + selectedText + after;
    const newContent =
      content.substring(0, selectionStart) +
      newText +
      content.substring(selectionEnd);

    setContent(newContent);
    isLocalChange.current = true;

    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = selectionStart;
        textarea.selectionEnd = selectionEnd + before.length + after.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd =
          selectionStart + before.length;
      }
      textarea.focus();
    }, 0);
  };

  const getPlaceholderText = () => {
    if (!content.trim()) {
      return `Type '/' for commands, or start writing...

Quick Commands:
/js [space] - JavaScript code block with placeholder
/ts [space] - TypeScript code block with placeholder  
/py [space] - Python code block with placeholder
/md [space] - Markdown code block with placeholder
/json [space] - JSON code block with placeholder
/code [space] - Generic code block
/h1, /h2, /h3 [space] - Headers
/quote [space] - Quote block
/todo [space] - Checklist item
/table [space] - Table template

Shortcuts:
Cmd/Ctrl + B - Bold
Cmd/Ctrl + I - Italic
Cmd/Ctrl + K - Link
Tab - Indent in code blocks`;
    }
    return "Continue writing...";
  };

  const PreviewContent = () => (
    <article className="prose prose-invert max-w-none p-6 prose-headings:text-white prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-white prose-strong:text-white prose-strong:font-bold prose-em:text-blue-100 prose-em:italic prose-a:text-blue-300 prose-a:hover:text-blue-200">
      {content.trim() ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: CodeBlock,
            blockquote(props) {
              const blockquoteContent = extractTextContent(props.children);
              return (
                <div className="relative group">
                  <CopyButton content={blockquoteContent} />
                  <blockquote className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-900/30 italic text-white my-4 rounded-r-md">
                    {props.children}
                  </blockquote>
                </div>
              );
            },
            p(props) {
              const paragraphContent = extractTextContent(props.children);
              return (
                <div className="relative group">
                  <CopyButton content={paragraphContent} />
                  <p className="text-white">{props.children}</p>
                </div>
              );
            },
            strong(props) {
              return (
                <strong className="font-bold text-white">{props.children}</strong>
              );
            },
            em(props) {
              return (
                <em className="italic text-blue-100">{props.children}</em>
              );
            },
            a(props) {
              const href = props.href || "";
              // Ensure https:// protocol
              const secureHref = href.startsWith("http://") 
                ? href.replace("http://", "https://")
                : href.startsWith("https://") || href.startsWith("/") || href.startsWith("#")
                ? href
                : `https://${href}`;
              
              return (
                <a
                  href={secureHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  {props.children}
                </a>
              );
            },
            table(props) {
              return (
                <div className="overflow-x-auto my-4">
                  <table className="w-full border-collapse border border-blue-600 rounded-lg">
                    {props.children}
                  </table>
                </div>
              );
            },
            th(props) {
              return (
                <th className="border border-blue-600 px-4 py-2 bg-blue-800/60 font-semibold text-left text-white">
                  {props.children}
                </th>
              );
            },
            td(props) {
              return (
                <td className="border border-blue-600 px-4 py-2 text-white">
                  {props.children}
                </td>
              );
            },
            ul(props) {
              return (
                <ul className="list-disc list-inside space-y-1 text-white">
                  {props.children}
                </ul>
              );
            },
            ol(props) {
              return (
                <ol className="list-decimal list-inside space-y-1 text-white">
                  {props.children}
                </ol>
              );
            },
            li(props) {
              return <li className="text-white">{props.children}</li>;
            },
            h1(props) {
              return <h1 className="text-white font-bold">{props.children}</h1>;
            },
            h2(props) {
              return <h2 className="text-white font-bold">{props.children}</h2>;
            },
            h3(props) {
              return <h3 className="text-white font-bold">{props.children}</h3>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <div className="text-blue-200/60 italic text-center py-12">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-blue-200">
            Start typing to see your content come to life...
          </p>
          <p className="text-sm mt-2 text-blue-300/70">
            Use{" "}
            <code className="bg-blue-800/60 px-2 py-1 rounded text-white">
              /
            </code>{" "}
            commands for quick formatting
          </p>
        </div>
      )}
    </article>
  );

  if (previewOnly) {
    return (
      <div className="h-full w-full bg-gray-100 relative">
        <Button
          onClick={() => setPreviewOnly(false)}
          className="absolute top-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Mode
        </Button>
        <Card className="h-full overflow-y-auto bg-gradient-to-br from-slate-900/80 to-blue-900/60 border-blue-600/30 backdrop-blur-sm">
          <PreviewContent />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full w-full bg-gray-100 relative">
      <Button
        onClick={() => setPreviewOnly(true)}
        className="absolute top-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview Only
      </Button>
      
      {/* Input Pane with Light Theme */}
      <Card className="flex flex-col h-full bg-white border-gray-200 shadow-sm">
        <div className="relative flex-grow">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={() => {}} // Handled by onInput
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            className="w-full h-full p-4 border-0 rounded-md resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm leading-relaxed bg-transparent text-gray-800 placeholder:text-gray-400"
            placeholder=""
            style={{
              minHeight: "100%",
              lineHeight: "1.6",
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
            }}
          />
          {/* Enhanced placeholder overlay when empty */}
          {!content.trim() && (
            <div className="absolute inset-4 pointer-events-none text-gray-400 text-sm leading-relaxed whitespace-pre-line font-mono">
              {getPlaceholderText()}
            </div>
          )}
        </div>
        <CardFooter className="py-2 px-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <div className="text-xs text-gray-600">
              {content.length} chars | Line{" "}
              {content.substring(0, cursorPosition).split("\n").length}
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Enhanced Preview Pane with Dark Theme and Blue Gradient Background */}
      <Card className="h-full overflow-y-auto bg-gradient-to-br from-slate-900/80 to-blue-900/60 border-blue-600/30 backdrop-blur-sm">
        <PreviewContent />
      </Card>
    </div>
  );
}

export default Editor;