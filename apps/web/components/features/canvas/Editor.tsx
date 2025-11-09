/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Check,
  Eye,
  Edit3,
  Download,
  Upload,
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
  // language?: string;
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
        // language={language}
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [colorTheme] = useState<ColorTheme>("light");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // derive dark mode from system preference (no toggle UI)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    try {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Safari fallback
      // @ts-expect
      mq.addListener(handler);
      return () =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mq.removeListener(handler);
    }
  }, []);

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
    let newValue = textarea.value;
    const { selectionStart } = textarea;

    // Auto-convert ++underline++ to <u>...</u> so preview shows underline (rehype-raw used)
    // and convert simple custom shortcuts (like ++, == for underline) — small, non-destructive transform
    newValue = newValue.replace(/\+\+([^\n\+]+?)\+\+/g, "<u>$1</u>");

    // Auto-detect heading when user types many # at line start (keep markdown but ensure proper spacing)
    // This is a gentle helper that won't remove user's text but will normalize '#Heading' -> '# Heading'
    newValue = newValue.replace(/(^|\n)(#{1,6})([^\s#\n])/g, "$1$2 $3");

    // Auto-detect URLs without protocol and make them clickable with https:// prefix (preserve original text)
    // We only transform in preview, not in underlying saved content — implement by inserting explicit https if user typed bare domain followed by space
    // Example: "example.com" -> "https://example.com" so ReactMarkdown treats as link
    newValue = newValue.replace(/(^|\s)((?:[a-z0-9-]+\.)+[a-z]{2,})(\s|$)/gi, (m, p1, p2, p3) => {
      // if already part of markdown link or has protocol, skip
      if (/https?:\/\//i.test(m) || /\[.*\]\(.*\)/.test(m)) return m;
      return `${p1}https://${p2}${p3}`;
    });

    // keep caret position reasonable — we update content normally and then reposition caret later
    setContent(newValue);
    isLocalChange.current = true;

    setTimeout(() => {
      // try to keep the caret at the same relative position after small transforms
      try {
        const diff = newValue.length - textarea.value.length;
        textarea.selectionStart = textarea.selectionEnd = selectionStart + Math.max(0, diff);
      } catch (err) {
        // ignore
      }
      textarea.focus();
    }, 0);
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
      return `Type '/' for commands, or start writing...\n\nQuick Commands:\n/js [space] - JavaScript code block\n/ts [space] - TypeScript code block  \n/py [space] - Python code block\n/md [space] - Markdown code block\n/json [space] - JSON code block\n/code [space] - Generic code block\n/h1, /h2, /h3 [space] - Headers\n/quote [space] - Quote block\n/todo [space] - Checklist item\n/table [space] - Table template\n\nShortcuts:\nCmd/Ctrl + B - Bold\nCmd/Ctrl + I - Italic\nCmd/Ctrl + K - Link\nTab - Indent`;
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

      if (fileExtension === 'pdf') {
        alert("PDF import requires pdf.js library. Please install it in your project:\nnpm install pdfjs-dist");
        return;
      }

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
            
           if (language && !['txt', 'md', 'markdown'].includes(fileExtension || '')) {

  importedContent =
    '\n\n```' + language + '\n' + text + '\n```\n\n';
} else {
  importedContent = '\n\n' + text + '\n\n';
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
        alert(`Unsupported file type: .${fileExtension}\n\nSupported formats:\n- Text: .txt, .md, .markdown\n- Code: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .h, .rs, .go\n- Config: .yml, .yaml, .json, .xml\n- Web: .html, .css, .scss`);
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

  const themeColors = isDarkMode ? darkThemes[colorTheme] : lightThemes[colorTheme];

  const toggleFullScreen = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = cardRef.current as any;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen API error", err);
    }
  };

  const PreviewContent = () => {
    // Preprocess content for preview: we allow a few safe auto transforms (underline via <u>)
    // Use rehypeRaw to render <u> from the transformed content.
    const previewSource = content;

    return (
      <article
        ref={previewRef}
        className={cn(
          "prose max-w-none p-4 sm:p-6",
          isDarkMode
            ? "prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-blue-400 prose-blockquote:text-gray-300"
            : ""
        )}
      >
        {previewSource.trim() ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
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
            {previewSource}
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
              Use <code className={cn("px-2 py-1 rounded", isDarkMode ? "bg-blue-800/60 text-white" : cn(themeColors.codeBg, themeColors.codeText))}>/</code> commands for quick formatting
            </p>
          </div>
        )}
      </article>
    );
  };

  return (
    <div
      className={cn(
        "h-full w-full relative",
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

      <div className="absolute top-4 right-4 z-10 flex flex-wrap justify-end gap-2">
        <Button
          onClick={triggerFileImport}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <Upload className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button
          onClick={exportToPDF}
          disabled={isExporting || !content.trim()}
          className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          size="sm"
        >
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{isExporting ? "Exporting..." : "PDF"}</span>
        </Button>
        <Button
          onClick={() => setIsEditMode(!isEditMode)}
          className={cn(
            "text-white",
            isEditMode
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          )}
          size="sm"
        >
          {isEditMode ? (
            <Eye className="h-4 w-4 sm:mr-2" />
          ) : (
            <Edit3 className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">{isEditMode ? "Preview" : "Edit"}</span>
        </Button>
        <Button
          onClick={toggleFullScreen}
          className="bg-slate-700 hover:bg-slate-600 text-white"
          size="sm"
        >
          <Palette className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Toggle Fullscreen</span>
        </Button>
      </div>

      <Card
        ref={cardRef}
        className={cn(
          "h-full overflow-y-auto border-0",
          isDarkMode
            ? themeColors.cardBg
            : cn(themeColors.cardBg, themeColors.cardBorder)
        )}
      >
        {isEditMode ? (
          <div className="relative h-full flex flex-col">
            <div className="relative flex-grow">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={() => {}}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                className={cn(
                  "absolute inset-0 w-full h-full p-4 sm:p-6 border-0 rounded-md resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm leading-relaxed bg-transparent",
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
                    "absolute inset-4 sm:inset-6 pointer-events-none text-sm leading-relaxed whitespace-pre-line font-mono",
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  {getPlaceholderText()}
                </div>
              )}
            </div>
            <CardFooter
              className={cn(
                "py-2 px-4 sm:px-6 border-t",
                isDarkMode
                  ? cn(themeColors.cardBorder, "bg-opacity-50")
                  : cn(themeColors.cardBorder, "bg-white/50")
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isConnected ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                  <span>{isConnected ? "Connected" : "Disconnected"}</span>
                </div>
                <div
                  className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {content.length} chars | Line {content.substring(0, cursorPosition).split("\n").length}
                </div>
              </div>
            </CardFooter>
          </div>
        ) : (
          <PreviewContent />
        )}
      </Card>
    </div>
  );
}

export default Editor;
