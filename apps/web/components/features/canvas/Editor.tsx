"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Check,
  Download,
  Upload,
  Palette,
  Maximize,
  Minimize,
} from "lucide-react";

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

interface CodeBlockProps {
  children?: ReactNode;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type ColorTheme = "nord" | "slate";

interface ThemeColors {
  bg: string;
  text: string;
  codeBg: string;
  codeBorder: string;
  codeText: string;
  blockquoteBg: string;
  blockquoteBorder: string;
  blockquoteText: string;
  linkColor: string;
  linkHover: string;
  tableBg: string;
  tableBorder: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableText: string;
  cardBg: string;
  cardBorder: string;
}

const darkThemes: Record<ColorTheme, ThemeColors> = {
  nord: {
    bg: "bg-slate-900",
    text: "text-slate-100",
    codeBg: "bg-slate-800",
    codeBorder: "border-slate-600",
    codeText: "text-slate-200",
    blockquoteBg: "bg-slate-800",
    blockquoteBorder: "border-slate-500",
    blockquoteText: "text-slate-200",
    linkColor: "text-cyan-400",
    linkHover: "hover:text-cyan-300",
    tableBg: "bg-slate-800",
    tableBorder: "border-slate-600",
    tableHeaderBg: "bg-slate-700",
    tableHeaderText: "text-slate-100",
    tableText: "text-slate-100",
    cardBg: "bg-slate-800",
    cardBorder: "border-slate-700",
  },
  slate: {
    bg: "bg-emerald-950",
    text: "text-emerald-100",
    codeBg: "bg-emerald-900",
    codeBorder: "border-emerald-700",
    codeText: "text-emerald-200",
    blockquoteBg: "bg-emerald-900",
    blockquoteBorder: "border-emerald-600",
    blockquoteText: "text-emerald-200",
    linkColor: "text-teal-400",
    linkHover: "hover:text-teal-300",
    tableBg: "bg-emerald-900",
    tableBorder: "border-emerald-700",
    tableHeaderBg: "bg-emerald-800",
    tableHeaderText: "text-emerald-100",
    tableText: "text-emerald-100",
    cardBg: "bg-emerald-900",
    cardBorder: "border-emerald-800",
  },
};

function CopyButton({
  content,
  theme,
}: {
  content: string;
  theme: ColorTheme;
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
      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity border bg-slate-800 hover:bg-slate-700 border-slate-700"
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

function CodeBlock({
  children,
  className,
  theme,
  ...rest
}: CodeBlockProps & { theme: ColorTheme }) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const isInline = !match;
  const content = String(children || "").replace(/\n$/, "");

  if (isInline) {
    return (
      <code
        {...rest}
        className="px-2 py-1 rounded font-mono text-sm border bg-slate-800 text-white border-slate-600"
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      {language && (
        <div className="absolute top-2 left-4 text-xs px-2 py-1 rounded-md z-10 text-gray-300 bg-gray-700">
          {language}
        </div>
      )}

      <CopyButton content={content} theme={theme} />

      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        className="rounded-lg border border-slate-700"
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          fontSize: "14px",
          lineHeight: "1.6",
          padding: "1rem",
          paddingTop: language ? "2.5rem" : "1rem",
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

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

export function Editor({ canvasId, initialContent }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [colorTheme, setColorTheme] = useState<ColorTheme>("nord");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useSocket(canvasId);

  const isLocalChange = useRef(false);
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (newContent: string) => {
      isLocalChange.current = false;
      setContent(newContent);
    };

    socket.on("canvas-updated", handleUpdate);

    return () => {
      socket.off("canvas-updated", handleUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (isConnected && socket && isLocalChange.current) {
      socket.emit("canvas-update", { canvasId, content: debouncedContent });
      isLocalChange.current = false;
    }
  }, [debouncedContent, canvasId, isConnected, socket]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

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

    if (e.key === "Enter") {
      const beforeCursor = content.substring(0, selectionStart);
      const lines = beforeCursor.split("\n");
      const currentLine = lines[lines.length - 1];

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

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const newValue = textarea.value;
    const { selectionStart } = textarea;

    if (newValue[selectionStart - 1] === " ") {
      const beforeCursor = newValue.substring(0, selectionStart - 1);
      const afterCursor = newValue.substring(selectionStart);
      
      const lineStart = beforeCursor.lastIndexOf("\n") + 1;
      const currentLine = beforeCursor.substring(lineStart);
      
      if (currentLine.trim().startsWith("/")) {
        const command = currentLine.trim().substring(1).toLowerCase();
        let replacement = "";

        switch (command) {
          case "js":
          case "javascript":
            replacement = "```javascript\n\n```";
            break;
          case "ts":
          case "typescript":
            replacement = "```typescript\n\n```";
            break;
          case "py":
          case "python":
            replacement = "```python\n\n```";
            break;
          case "md":
          case "markdown":
            replacement = "```markdown\n\n```";
            break;
          case "json":
            replacement = "```json\n\n```";
            break;
          case "code":
            replacement = "```\n\n```";
            break;
          case "h1":
            replacement = "# ";
            break;
          case "h2":
            replacement = "## ";
            break;
          case "h3":
            replacement = "### ";
            break;
          case "quote":
            replacement = "> ";
            break;
          case "todo":
            replacement = "- [ ] ";
            break;
          case "table":
            replacement =
              "| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |";
            break;
        }

        if (replacement) {
          e.preventDefault();
          
          const beforeLine = beforeCursor.substring(0, lineStart);
          const newContent = beforeLine + replacement + afterCursor;
          setContent(newContent);
          isLocalChange.current = true;

          setTimeout(() => {
            let newPosition;
            if (replacement.includes("```")) {
              const codeBlockStart = lineStart + replacement.indexOf("\n") + 1;
              newPosition = beforeLine.length + codeBlockStart;
            } else {
              newPosition = beforeLine.length + replacement.length;
            }
            textarea.selectionStart = textarea.selectionEnd = newPosition;
            textarea.focus();
          }, 0);
          return;
        }
      }
    }

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
/js - JavaScript code block
/ts - TypeScript code block  
/py - Python code block
/md - Markdown code block
/json - JSON code block
/code - Generic code block
/h1, /h2, /h3 - Headers
/quote - Quote block
/todo - Checklist item
/table - Table template

Shortcuts:
Cmd/Ctrl + B - Bold
Cmd/Ctrl + I - Italic
Cmd/Ctrl + K - Link
Tab - Indent`;
    }
    return "Continue writing...";
  };

  const exportToPDF = async () => {
    if (!previewRef.current) return;

    setIsExporting(true);

    try {
      const clonedContent = previewRef.current.cloneNode(true) as HTMLElement;
      const buttons = clonedContent.querySelectorAll("button");
      buttons.forEach((btn) => btn.remove());

      const allElements = clonedContent.querySelectorAll("*");
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlElement);

        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        const borderColor = computedStyle.borderColor;

        if (color && color !== "rgba(0, 0, 0, 0)" && !color.includes("oklch")) {
          htmlElement.style.color = color;
        }
        if (
          backgroundColor &&
          backgroundColor !== "rgba(0, 0, 0, 0)" &&
          !backgroundColor.includes("oklch")
        ) {
          htmlElement.style.backgroundColor = backgroundColor;
        }
        if (
          borderColor &&
          borderColor !== "rgba(0, 0, 0, 0)" &&
          !borderColor.includes("oklch")
        ) {
          htmlElement.style.borderColor = borderColor;
        }
      });

      const previewContent = clonedContent.innerHTML;
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        throw new Error("Please allow pop-ups to export PDF");
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Canvas Export - ${canvasId}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: rgb(26, 26, 26);
                background: rgb(255, 255, 255);
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
              }
              h1 { font-size: 2em; margin: 1em 0 0.5em 0; font-weight: bold; }
              h2 { font-size: 1.5em; margin: 0.83em 0 0.5em 0; font-weight: bold; }
              h3 { font-size: 1.17em; margin: 1em 0 0.5em 0; font-weight: bold; }
              p { margin: 1em 0; }
              code { background: rgb(245, 245, 245); padding: 2px 6px; border-radius: 3px; }
              pre { background: rgb(245, 245, 245); padding: 16px; border-radius: 6px; overflow-x: auto; margin: 1em 0; }
              blockquote { border-left: 4px solid rgb(0, 102, 204); padding-left: 16px; margin: 1em 0; }
              table { border-collapse: collapse; width: 100%; margin: 1em 0; }
              th, td { border: 1px solid rgb(221, 221, 221); padding: 12px; text-align: left; }
              th { background: rgb(245, 245, 245); font-weight: bold; }
              button { display: none !important; }
              @media print { body { padding: 20px; } @page { margin: 2cm; } }
            </style>
          </head>
          <body>${previewContent}</body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          setIsExporting(false);
        }, 250);
      };
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to export PDF. Please try again."
      );
      setIsExporting(false);
    }
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split(".").pop()?.toLowerCase();

    try {
      let importedContent = "";

      if (fileExtension === "pdf") {
        alert(
          "PDF import requires pdf.js library. Please install it in your project:\nnpm install pdfjs-dist"
        );
        return;
      }

      const validExtensions = [
        "txt",
        "md",
        "markdown",
        "js",
        "jsx",
        "ts",
        "tsx",
        "py",
        "java",
        "cpp",
        "c",
        "h",
        "rs",
        "go",
        "yml",
        "yaml",
        "json",
        "xml",
        "html",
        "css",
        "scss",
      ];

      if (validExtensions.includes(fileExtension || "")) {
        const reader = new FileReader();

        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (text) {
            const textarea = textareaRef.current;
            if (!textarea) {
              setContent(text);
              isLocalChange.current = true;
              return;
            }

            const languageMap: Record<string, string> = {
              js: "javascript",
              jsx: "javascript",
              ts: "typescript",
              tsx: "typescript",
              py: "python",
              java: "java",
              cpp: "cpp",
              c: "c",
              h: "c",
              rs: "rust",
              go: "go",
              yml: "yaml",
              yaml: "yaml",
              json: "json",
              xml: "xml",
              html: "html",
              css: "css",
              scss: "scss",
            };

            const language = languageMap[fileExtension || ""] || fileExtension;

            if (
              language &&
              !["txt", "md", "markdown"].includes(fileExtension || "")
            ) {
              importedContent = `\n\n\`\`\`${language}\n${text}\n\`\`\`\n\n`;
            } else {
              importedContent = `\n\n${text}\n\n`;
            }

            const { selectionStart } = textarea;
            const beforeCursor = content.substring(0, selectionStart);
            const afterCursor = content.substring(selectionStart);
            const newContent = beforeCursor + importedContent + afterCursor;

            setContent(newContent);
            isLocalChange.current = true;

            setTimeout(() => {
              const newPosition = selectionStart + importedContent.length;
              textarea.selectionStart = textarea.selectionEnd = newPosition;
              textarea.focus();
            }, 0);
          }
        };

        reader.onerror = () => {
          alert("Failed to read file. Please try again.");
        };

        reader.readAsText(file);
      } else {
        alert(
          `Unsupported file type: .${fileExtension}\n\nSupported formats:\n- Text: .txt, .md, .markdown\n- Code: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .h, .rs, .go\n- Config: .yml, .yaml, .json, .xml\n- Web: .html, .css, .scss`
        );
      }
    } catch (error) {
      console.error("Failed to import file:", error);
      alert("Failed to import file. Please try again.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileImport = () => {
    fileInputRef.current?.click();
  };

  const themeColors = darkThemes[colorTheme];

  const ThemeSelector = () => (
    <div className="absolute z-20 right-0 mt-2 w-36">
      <div className="rounded-lg shadow-lg border bg-slate-800 border-slate-700">
        <button
          onClick={() => {
            setColorTheme("nord");
            setShowThemeMenu(false);
          }}
          className={cn(
            "w-full px-4 py-2 text-sm text-left hover:bg-opacity-80 rounded-t-lg transition-colors",
            colorTheme === "nord" && "bg-slate-700",
            "text-white hover:bg-slate-700"
          )}
        >
          Nord
        </button>
        <button
          onClick={() => {
            setColorTheme("slate");
            setShowThemeMenu(false);
          }}
          className={cn(
            "w-full px-4 py-2 text-sm text-left hover:bg-opacity-80 border-t rounded-b-lg transition-colors",
            colorTheme === "slate" && "bg-slate-700",
            "text-white border-slate-700 hover:bg-slate-700"
          )}
        >
          Emerald
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full relative", themeColors.bg)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.rs,.go,.yml,.yaml,.json,.xml,.html,.css,.scss,.pdf"
        onChange={handleImportFile}
        className="hidden"
      />

      <div className="absolute top-4 right-4 z-10 flex flex-wrap justify-end gap-2">
        <div className="relative">
          <Button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="text-white bg-slate-700 hover:bg-slate-600 h-8 sm:h-9 px-2 sm:px-3"
            size="sm"
          >
            <Palette className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Theme</span>
          </Button>
          {showThemeMenu && <ThemeSelector />}
        </div>
        <Button
          onClick={toggleFullscreen}
          className="text-white bg-slate-700 hover:bg-slate-600 h-8 sm:h-9 px-2 sm:px-3"
          size="sm"
        >
          {isFullscreen ? (
            <Minimize className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          ) : (
            <Maximize className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">
            {isFullscreen ? "Exit" : "Full"}
          </span>
        </Button>
        <Button
          onClick={triggerFileImport}
          className="bg-purple-600 hover:bg-purple-700 text-white h-8 sm:h-9 px-2 sm:px-3"
          size="sm"
        >
          <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button
          onClick={exportToPDF}
          disabled={isExporting || !content.trim()}
          className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 h-8 sm:h-9 px-2 sm:px-3"
          size="sm"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">
            {isExporting ? "Exporting..." : "PDF"}
          </span>
        </Button>
      </div>

      <Card className={cn("h-full overflow-hidden border-0", themeColors.cardBg)}>
        <div className="relative h-full">
          <div className="absolute inset-0 overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={() => {}}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
              className="absolute inset-0 w-full h-full p-4 sm:p-6 border-0 rounded-md resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm leading-relaxed bg-transparent text-transparent caret-white selection:bg-blue-500/30 z-20"
              placeholder=""
              style={{
                minHeight: "100%",
                lineHeight: "1.8",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
              }}
            />

            <div
              ref={overlayRef}
              className="absolute inset-0 p-4 sm:p-6 pointer-events-none z-10"
              style={{
                lineHeight: "1.8",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
              }}
            >
              {!content.trim() ? (
                <div className="text-sm text-gray-500 whitespace-pre-line">
                  {getPlaceholderText()}
                </div>
              ) : (
                <article
                  ref={previewRef}
                  className="prose prose-sm max-w-none prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-blue-400 prose-blockquote:text-gray-300"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: (props) => <CodeBlock {...props} theme={colorTheme} />,
                      blockquote(props) {
                        const blockquoteContent = extractTextContent(props.children);
                        return (
                          <div className="relative group">
                            <CopyButton content={blockquoteContent} theme={colorTheme} />
                            <blockquote className="border-l-4 pl-4 py-2 italic my-4 rounded-r-md border-blue-500 bg-blue-900/30 text-gray-100">
                              {props.children}
                            </blockquote>
                          </div>
                        );
                      },
                      p(props) {
                        const paragraphContent = extractTextContent(props.children);
                        return (
                          <div className="relative group">
                            <CopyButton content={paragraphContent} theme={colorTheme} />
                            <p className="text-gray-300">{props.children}</p>
                          </div>
                        );
                      },
                      strong(props) {
                        return (
                          <strong className="font-bold text-white">
                            {props.children}
                          </strong>
                        );
                      },
                      em(props) {
                        return (
                          <em className="italic text-blue-200">{props.children}</em>
                        );
                      },
                      a(props) {
                        const href = props.href || "";
                        const secureHref = href.startsWith("http://")
                          ? href.replace("http://", "https://")
                          : href.startsWith("https://") ||
                              href.startsWith("/") ||
                              href.startsWith("#")
                            ? href
                            : `https://${href}`;

                        return (
                          <a
                            href={secureHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-400 hover:text-blue-300 pointer-events-auto"
                          >
                            {props.children}
                          </a>
                        );
                      },
                      table(props) {
                        return (
                          <div className="overflow-x-auto my-4">
                            <table className="w-full border-collapse border rounded-lg border-blue-600">
                              {props.children}
                            </table>
                          </div>
                        );
                      },
                      th(props) {
                        return (
                          <th className="border px-4 py-2 font-semibold text-left border-blue-600 bg-blue-900/60 text-white">
                            {props.children}
                          </th>
                        );
                      },
                      td(props) {
                        return (
                          <td className="border px-4 py-2 border-blue-600 text-gray-100">
                            {props.children}
                          </td>
                        );
                      },
                      ul(props) {
                        return (
                          <ul className="list-disc list-inside space-y-1 text-gray-100">
                            {props.children}
                          </ul>
                        );
                      },
                      ol(props) {
                        return (
                          <ol className="list-decimal list-inside space-y-1 text-gray-100">
                            {props.children}
                          </ol>
                        );
                      },
                      li(props) {
                        return <li className="text-gray-100">{props.children}</li>;
                      },
                      h1(props) {
                        return <h1 className="font-bold text-white text-3xl">{props.children}</h1>;
                      },
                      h2(props) {
                        return <h2 className="font-bold text-white text-2xl">{props.children}</h2>;
                      },
                      h3(props) {
                        return <h3 className="font-bold text-white text-xl">{props.children}</h3>;
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          </div>

          <CardFooter
            className={cn(
              "absolute bottom-0 left-0 right-0 py-2 px-4 sm:px-6 border-t bg-opacity-95 backdrop-blur-sm z-30",
              themeColors.cardBorder,
              themeColors.cardBg
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isConnected ? "bg-green-500" : "bg-red-500"
                  )}
                />
                <span className="hidden xs:inline">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                <span className="hidden sm:inline">
                  {content.length} chars |{" "}
                </span>
                <span>
                  Line {content.substring(0, cursorPosition).split("\n").length}
                </span>
              </div>
            </div>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}

export default Editor;