"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Check,
  Eye,
  Edit3,
  Download,
  Upload,
  Moon,
  Sun,
  Palette,
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

type ColorTheme = "light" | "nord" | "slate" | "ocean";

interface ThemeColors {
  bg: string;
  text: string;
  codeBlockBg: string;
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

// Light mode themes
const lightThemes: Record<ColorTheme, ThemeColors> = {
  light: {
    bg: "bg-indigo-100",
    text: "text-indigo-950",
    codeBlockBg: "#f8f5ff",
    codeBg: "bg-indigo-200",
    codeBorder: "border-indigo-300",
    codeText: "text-indigo-900",
    blockquoteBg: "bg-indigo-200",
    blockquoteBorder: "border-indigo-500",
    blockquoteText: "text-indigo-800",
    linkColor: "text-indigo-600",
    linkHover: "hover:text-indigo-700",
    tableBg: "bg-indigo-50",
    tableBorder: "border-indigo-300",
    tableHeaderBg: "bg-indigo-200",
    tableHeaderText: "text-indigo-900",
    tableText: "text-indigo-900",
    cardBg: "bg-indigo-50",
    cardBorder: "border-indigo-200",
  },
  nord: {
    bg: "bg-slate-200",
    text: "text-slate-900",
    codeBlockBg: "#eceff4",
    codeBg: "bg-slate-300",
    codeBorder: "border-slate-400",
    codeText: "text-slate-900",
    blockquoteBg: "bg-slate-300",
    blockquoteBorder: "border-slate-600",
    blockquoteText: "text-slate-800",
    linkColor: "text-cyan-700",
    linkHover: "hover:text-cyan-800",
    tableBg: "bg-slate-100",
    tableBorder: "border-slate-400",
    tableHeaderBg: "bg-slate-300",
    tableHeaderText: "text-slate-900",
    tableText: "text-slate-900",
    cardBg: "bg-slate-100",
    cardBorder: "border-slate-300",
  },
  slate: {
    bg: "bg-emerald-100",
    text: "text-emerald-950",
    codeBlockBg: "#f0fdf4",
    codeBg: "bg-emerald-200",
    codeBorder: "border-emerald-300",
    codeText: "text-emerald-900",
    blockquoteBg: "bg-emerald-200",
    blockquoteBorder: "border-emerald-600",
    blockquoteText: "text-emerald-800",
    linkColor: "text-teal-600",
    linkHover: "hover:text-teal-700",
    tableBg: "bg-emerald-50",
    tableBorder: "border-emerald-300",
    tableHeaderBg: "bg-emerald-200",
    tableHeaderText: "text-emerald-900",
    tableText: "text-emerald-900",
    cardBg: "bg-emerald-50",
    cardBorder: "border-emerald-200",
  },
  ocean: {
    bg: "bg-cyan-100",
    text: "text-cyan-950",
    codeBlockBg: "#ecf8ff",
    codeBg: "bg-cyan-200",
    codeBorder: "border-cyan-300",
    codeText: "text-cyan-900",
    blockquoteBg: "bg-cyan-200",
    blockquoteBorder: "border-blue-600",
    blockquoteText: "text-cyan-800",
    linkColor: "text-blue-600",
    linkHover: "hover:text-blue-700",
    tableBg: "bg-cyan-50",
    tableBorder: "border-cyan-300",
    tableHeaderBg: "bg-cyan-200",
    tableHeaderText: "text-cyan-900",
    tableText: "text-cyan-900",
    cardBg: "bg-cyan-50",
    cardBorder: "border-cyan-200",
  },
};

// Dark mode themes
const darkThemes: Record<ColorTheme, ThemeColors> = {
  light: {
    bg: "bg-indigo-950",
    text: "text-indigo-100",
    codeBlockBg: "#1e1b4b",
    codeBg: "bg-indigo-900",
    codeBorder: "border-indigo-700",
    codeText: "text-indigo-200",
    blockquoteBg: "bg-indigo-900",
    blockquoteBorder: "border-indigo-500",
    blockquoteText: "text-indigo-200",
    linkColor: "text-indigo-400",
    linkHover: "hover:text-indigo-300",
    tableBg: "bg-indigo-900",
    tableBorder: "border-indigo-700",
    tableHeaderBg: "bg-indigo-800",
    tableHeaderText: "text-indigo-100",
    tableText: "text-indigo-100",
    cardBg: "bg-indigo-900",
    cardBorder: "border-indigo-800",
  },
  nord: {
    bg: "bg-slate-900",
    text: "text-slate-100",
    codeBlockBg: "#1e293b",
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
    codeBlockBg: "#022c22",
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
  ocean: {
    bg: "bg-cyan-950",
    text: "text-cyan-100",
    codeBlockBg: "#083344",
    codeBg: "bg-cyan-900",
    codeBorder: "border-cyan-700",
    codeText: "text-cyan-200",
    blockquoteBg: "bg-cyan-900",
    blockquoteBorder: "border-blue-500",
    blockquoteText: "text-cyan-200",
    linkColor: "text-blue-400",
    linkHover: "hover:text-blue-300",
    tableBg: "bg-cyan-900",
    tableBorder: "border-cyan-700",
    tableHeaderBg: "bg-cyan-800",
    tableHeaderText: "text-cyan-100",
    tableText: "text-cyan-100",
    cardBg: "bg-cyan-900",
    cardBorder: "border-cyan-800",
  },
};

function CopyButton({
  content,
  isDarkMode,
  theme,
}: {
  content: string;
  language?: string;
  isDarkMode: boolean;
  theme: ColorTheme;
}) {
  const [copied, setCopied] = useState(false);
  const themeColors = isDarkMode ? darkThemes[theme] : lightThemes[theme];

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
      className={cn(
        "absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity border",
        isDarkMode
          ? "bg-slate-800 hover:bg-slate-700 border-slate-700"
          : "bg-white/50 hover:bg-white/80 border-slate-300"
      )}
      onClick={handleCopy}
    >
      {copied ? (
        <Check
          className={cn(
            "h-3 w-3",
            isDarkMode ? "text-green-400" : "text-green-600"
          )}
        />
      ) : (
        <Copy
          className={cn(
            "h-3 w-3",
            isDarkMode ? "text-white" : themeColors.codeText
          )}
        />
      )}
    </Button>
  );
}

function CodeBlock({
  children,
  className,
  isDarkMode,
  theme,
  ...rest
}: CodeBlockProps & { isDarkMode: boolean; theme: ColorTheme }) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const isInline = !match;
  const content = String(children || "").replace(/\n$/, "");
  const themeColors = isDarkMode ? darkThemes[theme] : lightThemes[theme];

  if (isInline) {
    return (
      <code
        {...rest}
        className={cn(
          "px-2 py-1 rounded font-mono text-sm border",
          isDarkMode
            ? "bg-slate-800 text-white border-slate-600"
            : cn(
                themeColors.codeBg,
                themeColors.codeText,
                themeColors.codeBorder
              )
        )}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      {language && (
        <div
          className={cn(
            "absolute top-2 left-4 text-xs px-2 py-1 rounded-md z-10",
            isDarkMode
              ? "text-gray-300 bg-gray-700"
              : cn(themeColors.codeBg, themeColors.codeText)
          )}
        >
          {language}
        </div>
      )}

      <CopyButton
        content={content}
        language={language}
        isDarkMode={isDarkMode}
        theme={theme}
      />

      <SyntaxHighlighter
        style={isDarkMode ? oneDark : oneLight}
        language={language || "text"}
        PreTag="div"
        className={cn(
          "rounded-lg border",
          isDarkMode ? "border-slate-700" : themeColors.codeBorder
        )}
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
  const [previewOnly, setPreviewOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [colorTheme, setColorTheme] = useState<ColorTheme>("light");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const words = beforeCursor.split(/\s/);
      const lastWord = words[words.length - 1];

      if (lastWord.startsWith("/")) {
        const command = lastWord.substring(1).toLowerCase();
        let replacement = "";
        let cursorOffset = 0;

        switch (command) {
          case "code":
            replacement = "```\n// Add your code here\n```";
            cursorOffset = 4;
            break;
          case "js":
          case "javascript":
            replacement =
              "```javascript\n// Add your JavaScript code here\nconsole.log('Hello, World!');\n```";
            cursorOffset = 13;
            break;
          case "ts":
          case "typescript":
            replacement =
              "```typescript\n// Add your TypeScript code here\ninterface Example {\n  message: string;\n}\n\nconst example: Example = {\n  message: 'Hello, World!'\n};\n```";
            cursorOffset = 14;
            break;
          case "py":
          case "python":
            replacement =
              "```python\n# Add your Python code here\ndef hello_world():\n    print('Hello, World!')\n\nhello_world()\n```";
            cursorOffset = 10;
            break;
          case "md":
          case "markdown":
            replacement =
              "```markdown\n# Add your Markdown content here\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2\n```";
            cursorOffset = 12;
            break;
          case "json":
            replacement =
              '```json\n{\n  "key": "value",\n  "number": 123,\n  "boolean": true\n}\n```';
            cursorOffset = 8;
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
            cursorOffset = 12;
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
/js [space] - JavaScript code block
/ts [space] - TypeScript code block  
/py [space] - Python code block
/md [space] - Markdown code block
/json [space] - JSON code block
/code [space] - Generic code block
/h1, /h2, /h3 [space] - Headers
/quote [space] - Quote block
/todo [space] - Checklist item
/table [space] - Table template

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

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    try {
      let importedContent = "";

      // Handle PDF files
      if (fileExtension === 'pdf') {
        // For PDFs, we need a library like pdf.js
        // Since we can't install it here, we'll show a message
        alert("PDF import requires pdf.js library. Please install it in your project:\nnpm install pdfjs-dist");
        return;
      }

      // Handle code and text files
      const validExtensions = ['txt', 'md', 'markdown', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'rs', 'go', 'yml', 'yaml', 'json', 'xml', 'html', 'css', 'scss'];
      
      if (validExtensions.includes(fileExtension || '')) {
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

            // Get language identifier for code blocks
            const languageMap: Record<string, string> = {
              'js': 'javascript',
              'jsx': 'javascript',
              'ts': 'typescript',
              'tsx': 'typescript',
              'py': 'python',
              'java': 'java',
              'cpp': 'cpp',
              'c': 'c',
              'h': 'c',
              'rs': 'rust',
              'go': 'go',
              'yml': 'yaml',
              'yaml': 'yaml',
              'json': 'json',
              'xml': 'xml',
              'html': 'html',
              'css': 'css',
              'scss': 'scss',
            };

            const language = languageMap[fileExtension || ''] || fileExtension;
            
            // Format as code block if it's a code file
            if (language && !['txt', 'md', 'markdown'].includes(fileExtension || '')) {
              importedContent = `\n\n\`\`\`${language}\n${text}\n\`\`\`\n\n`;
            } else {
              importedContent = `\n\n${text}\n\n`;
            }

            // Insert at cursor position instead of overriding
            const { selectionStart } = textarea;
            const beforeCursor = content.substring(0, selectionStart);
            const afterCursor = content.substring(selectionStart);
            const newContent = beforeCursor + importedContent + afterCursor;
            
            setContent(newContent);
            isLocalChange.current = true;

            // Set cursor position after imported content
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
        alert(`Unsupported file type: .${fileExtension}\n\nSupported formats:\n- Text: .txt, .md, .markdown\n- Code: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .h, .rs, .go\n- Config: .yml, .yaml, .json, .xml\n- Web: .html, .css, .scss`);
      }
    } catch (error) {
      console.error("Failed to import file:", error);
      alert("Failed to import file. Please try again.");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileImport = () => {
    fileInputRef.current?.click();
  };

  const themeColors = isDarkMode ? darkThemes[colorTheme] : lightThemes[colorTheme];

  const PreviewContent = () => (
    <article
      ref={previewRef}
      className={cn(
        "prose max-w-none p-4 sm:p-6",
        isDarkMode
          ? "prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-blue-400 prose-blockquote:text-gray-300"
          : ""
      )}
    >
      {content.trim() ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: (props) => (
              <CodeBlock
                {...props}
                isDarkMode={isDarkMode}
                theme={colorTheme}
              />
            ),
            blockquote(props) {
              const blockquoteContent = extractTextContent(props.children);
              return (
                <div className="relative group">
                  <CopyButton
                    content={blockquoteContent}
                    isDarkMode={isDarkMode}
                    theme={colorTheme}
                  />
                  <blockquote
                    className={cn(
                      "border-l-4 pl-4 py-2 italic my-4 rounded-r-md",
                      isDarkMode
                        ? "border-blue-500 bg-blue-900/30 text-gray-100"
                        : cn(
                            themeColors.blockquoteBorder,
                            themeColors.blockquoteBg,
                            themeColors.blockquoteText
                          )
                    )}
                  >
                    {props.children}
                  </blockquote>
                </div>
              );
            },
            p(props) {
              const paragraphContent = extractTextContent(props.children);
              return (
                <div className="relative group">
                  <CopyButton
                    content={paragraphContent}
                    isDarkMode={isDarkMode}
                    theme={colorTheme}
                  />
                  <p className={isDarkMode ? "text-gray-300" : themeColors.text}>
                    {props.children}
                  </p>
                </div>
              );
            },
            strong(props) {
              return (
                <strong
                  className={cn(
                    "font-bold",
                    isDarkMode ? "text-white" : themeColors.text
                  )}
                >
                  {props.children}
                </strong>
              );
            },
            em(props) {
              return (
                <em
                  className={cn(
                    "italic",
                    isDarkMode
                      ? "text-blue-200"
                      : cn(themeColors.linkColor, themeColors.linkHover)
                  )}
                >
                  {props.children}
                </em>
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
                  className={cn(
                    "underline",
                    isDarkMode
                      ? "text-blue-400 hover:text-blue-300"
                      : cn(themeColors.linkColor, themeColors.linkHover)
                  )}
                >
                  {props.children}
                </a>
              );
            },
            table(props) {
              return (
                <div className="overflow-x-auto my-4">
                  <table
                    className={cn(
                      "w-full border-collapse border rounded-lg",
                      isDarkMode ? "border-blue-600" : themeColors.tableBorder
                    )}
                  >
                    {props.children}
                  </table>
                </div>
              );
            },
            th(props) {
              return (
                <th
                  className={cn(
                    "border px-4 py-2 font-semibold text-left",
                    isDarkMode
                      ? "border-blue-600 bg-blue-900/60 text-white"
                      : cn(
                          themeColors.tableBorder,
                          themeColors.tableHeaderBg,
                          themeColors.tableHeaderText
                        )
                  )}
                >
                  {props.children}
                </th>
              );
            },
            td(props) {
              return (
                <td
                  className={cn(
                    "border px-4 py-2",
                    isDarkMode
                      ? "border-blue-600 text-gray-100"
                      : cn(
                          themeColors.tableBorder,
                          themeColors.tableText
                        )
                  )}
                >
                  {props.children}
                </td>
              );
            },
            ul(props) {
              return (
                <ul
                  className={cn(
                    "list-disc list-inside space-y-1",
                    isDarkMode ? "text-gray-100" : themeColors.text
                  )}
                >
                  {props.children}
                </ul>
              );
            },
            ol(props) {
              return (
                <ol
                  className={cn(
                    "list-decimal list-inside space-y-1",
                    isDarkMode ? "text-gray-100" : themeColors.text
                  )}
                >
                  {props.children}
                </ol>
              );
            },
            li(props) {
              return (
                <li className={isDarkMode ? "text-gray-100" : themeColors.text}>
                  {props.children}
                </li>
              );
            },
            h1(props) {
              return (
                <h1
                  className={cn(
                    "font-bold",
                    isDarkMode ? "text-white" : themeColors.text
                  )}
                >
                  {props.children}
                </h1>
              );
            },
            h2(props) {
              return (
                <h2
                  className={cn(
                    "font-bold",
                    isDarkMode ? "text-white" : themeColors.text
                  )}
                >
                  {props.children}
                </h2>
              );
            },
            h3(props) {
              return (
                <h3
                  className={cn(
                    "font-bold",
                    isDarkMode ? "text-white" : themeColors.text
                  )}
                >
                  {props.children}
                </h3>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <div
          className={cn(
            "italic text-center py-12",
            isDarkMode ? "text-blue-200/60" : "text-gray-400"
          )}
        >
          <div className="text-4xl mb-4">✨</div>
          <p className={isDarkMode ? "text-blue-200" : "text-gray-600"}>
            Start typing to see your content come to life...
          </p>
          <p
            className={cn(
              "text-sm mt-2",
              isDarkMode ? "text-blue-300/70" : "text-gray-500"
            )}
          >
            Use{" "}
            <code
              className={cn(
                "px-2 py-1 rounded",
                isDarkMode
                  ? "bg-blue-800/60 text-white"
                  : cn(themeColors.codeBg, themeColors.codeText)
              )}
            >
              /
            </code>{" "}
            commands for quick formatting
          </p>
        </div>
      )}
    </article>
  );

  const ThemeSelector = () => (
    <div className="absolute z-20 right-0 mt-2 w-36">
      <div
        className={cn(
          "rounded-lg shadow-lg border",
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        )}
      >
        <button
          onClick={() => {
            setColorTheme("light");
            setShowThemeMenu(false);
          }}
          className={cn(
            "w-full px-4 py-2 text-sm text-left hover:bg-opacity-80 rounded-t-lg transition-colors",
            colorTheme === "light" &&
              (isDarkMode ? "bg-slate-700" : "bg-indigo-100"),
            isDarkMode ? "text-white hover:bg-slate-700" : "text-gray-900 hover:bg-gray-100"
          )}
        >
          Indigo
        </button>
        <button
          onClick={() => {
            setColorTheme("nord");
            setShowThemeMenu(false);
          }}
          className={cn(
            "w-full px-4 py-2 text-sm text-left hover:bg-opacity-80 border-t transition-colors",
            colorTheme === "nord" &&
              (isDarkMode ? "bg-slate-700" : "bg-slate-100"),
            isDarkMode
              ? "text-white border-slate-700 hover:bg-slate-700"
              : "text-gray-900 border-gray-200 hover:bg-gray-100"
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
            "w-full px-4 py-2 text-sm text-left hover:bg-opacity-80 border-t transition-colors",
            colorTheme === "slate" &&
              (isDarkMode ? "bg-slate-700" : "bg-emerald-100"),
            isDarkMode
              ? "text-white border-slate-700 hover:bg-slate-700"
              : "text-gray-900 border-gray-200 hover:bg-gray-100"
          )}
        >
          Emerald
        </button>
        <button
          onClick={() => {
            setColorTheme("ocean");
            setShowThemeMenu(false);
          }}
          className={cn(
            "w-full px-4 py-2 text-sm text-left hover:bg-opacity-80 border-t rounded-b-lg transition-colors",
            colorTheme === "ocean" &&
              (isDarkMode ? "bg-slate-700" : "bg-cyan-100"),
            isDarkMode
              ? "text-white border-slate-700 hover:bg-slate-700"
              : "text-gray-900 border-gray-200 hover:bg-gray-100"
          )}
        >
          Ocean
        </button>
      </div>
    </div>
  );

  if (previewOnly) {
    return (
      <div
        className={cn(
          "h-full w-full relative",
          isDarkMode ? themeColors.bg : themeColors.bg
        )}
      >
        <div className="absolute top-4 right-4 z-10 flex flex-wrap justify-end gap-2">
          <div className="relative">
            <Button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="text-white bg-slate-700 hover:bg-slate-600"
              size="sm"
            >
              <Palette className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Theme</span>
            </Button>
            {showThemeMenu && <ThemeSelector />}
          </div>
          <Button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-white bg-slate-700 hover:bg-slate-600"
            size="sm"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 sm:mr-2" />
            ) : (
              <Moon className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{isDarkMode ? "Light" : "Dark"}</span>
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={isExporting || !content.trim()}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            size="sm"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export PDF"}</span>
          </Button>
          <Button
            onClick={() => setPreviewOnly(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Edit3 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
        <Card
          className={cn(
            "h-full overflow-y-auto border-0",
            isDarkMode
              ? themeColors.cardBg
              : cn(themeColors.cardBg, themeColors.cardBorder)
          )}
        >
          <PreviewContent />
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 h-full w-full p-2 sm:p-4 relative",
        isDarkMode ? themeColors.bg : themeColors.bg
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.rs,.go,.yml,.yaml,.json,.xml,.html,.css,.scss,.pdf"
        onChange={handleImportFile}
        className="hidden"
      />

      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex flex-wrap justify-end gap-1 sm:gap-2">
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
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="text-white bg-slate-700 hover:bg-slate-600 h-8 sm:h-9 px-2 sm:px-3"
          size="sm"
        >
          {isDarkMode ? (
            <Sun className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          ) : (
            <Moon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">{isDarkMode ? "Light" : "Dark"}</span>
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
          <span className="hidden sm:inline">{isExporting ? "Exporting..." : "PDF"}</span>
        </Button>
        <Button
          onClick={() => setPreviewOnly(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 px-2 sm:px-3"
          size="sm"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
      </div>

      <Card
        className={cn(
          "flex flex-col h-full border shadow-lg mt-12 sm:mt-14 lg:mt-0",
          isDarkMode
            ? cn(themeColors.cardBg, themeColors.cardBorder)
            : cn(themeColors.cardBg, themeColors.cardBorder)
        )}
      >
        <div className="relative flex-grow">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={() => {}}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            className={cn(
              "absolute inset-0 w-full h-full p-3 sm:p-4 border-0 rounded-md resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-xs sm:text-sm leading-relaxed bg-transparent",
              isDarkMode
                ? "text-gray-100 placeholder:text-gray-500"
                : cn(themeColors.text, "placeholder:text-gray-400")
            )}
            placeholder=""
            style={{
              minHeight: "100%",
              lineHeight: "1.6",
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
            }}
          />
          {!content.trim() && (
            <div
              className={cn(
                "absolute inset-3 sm:inset-4 pointer-events-none text-xs sm:text-sm leading-relaxed whitespace-pre-line font-mono",
                isDarkMode ? "text-gray-500" : "text-gray-400"
              )}
            >
              {getPlaceholderText()}
            </div>
          )}
        </div>
        <CardFooter
          className={cn(
            "py-1.5 sm:py-2 px-3 sm:px-4 border-t",
            isDarkMode
              ? cn(themeColors.cardBorder, "bg-opacity-50")
              : cn(themeColors.cardBorder, "bg-white/50")
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 text-xs",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span className="hidden xs:inline">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <div
              className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}
            >
              <span className="hidden sm:inline">{content.length} chars | </span>
              <span>Line {content.substring(0, cursorPosition).split("\n").length}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Card
        className={cn(
          "h-full overflow-y-auto border backdrop-blur-sm shadow-lg",
          isDarkMode
            ? cn(themeColors.cardBg, themeColors.cardBorder)
            : cn(themeColors.cardBg, themeColors.cardBorder)
        )}
      >
        <PreviewContent />
      </Card>
    </div>
  );
}

export default Editor;