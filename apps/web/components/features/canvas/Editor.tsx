"use client";

import { useState, useEffect, useRef, ReactNode, DragEvent, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Baseline,
  Highlighter,
  FileUp,
  Sigma,
  Terminal,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListTodo,
  Quote,
  Code2,
  Table as TableIcon,
  Image as ImageIcon,
  FileJson,
  FileCode,
  Braces,
  Coffee,
  FileType,
} from "lucide-react";

import { useSocket } from "@/hooks/useSocket";
import { useDebounce } from "@/hooks/useDebounce";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ------------------------------------------------------------------
// 1. Interfaces & Types
// ------------------------------------------------------------------

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
  appBg: string;
  text: string;
  mutedText: string;
  border: string;
  highlight: string;
  codeBlockBg: string;
  proseClass: string;
  menuBg: string;
  menuHover: string;
}

interface CommandItem {
    label: string;
    description: string;
    value: string;
    offset: number;
    icon: React.ElementType;
    shortcut?: string; // Added for explicit searching like /js
}

// ------------------------------------------------------------------
// 2. Constants
// ------------------------------------------------------------------

// Expanded Slash Commands to include language-specific snippets
const SLASH_COMMANDS: CommandItem[] = [
    // --- Basic Formatting ---
    { label: "Heading 1", description: "Big section heading", value: "# ", offset: 2, icon: Heading1 },
    { label: "Heading 2", description: "Medium section heading", value: "## ", offset: 3, icon: Heading2 },
    { label: "Heading 3", description: "Small section heading", value: "### ", offset: 4, icon: Heading3 },
    { label: "Bullet List", description: "Create a simple list", value: "- ", offset: 2, icon: List },
    { label: "To-do List", description: "Track tasks", value: "- [ ] ", offset: 6, icon: ListTodo },
    { label: "Quote", description: "Capture a quote", value: "> ", offset: 2, icon: Quote },
    { label: "Table", description: "Insert a table", value: "| Header | Header |\n| --- | --- |\n| Cell | Cell |", offset: 12, icon: TableIcon },
    { label: "Math", description: "KaTeX Equation", value: "$$\n\n$$", offset: 3, icon: Sigma },
    { label: "Image", description: "Insert image link", value: "![Alt text](url)", offset: 11, icon: ImageIcon },

    // --- Code Snippets ---
    { label: "Code Block", description: "Generic code snippet", value: "```\n\n```", offset: 4, icon: Code2, shortcut: "code" },
    { label: "JavaScript", description: "JS code block", value: "```javascript\n\n```", offset: 14, icon: FileCode, shortcut: "js" },
    { label: "TypeScript", description: "TS code block", value: "```typescript\n\n```", offset: 14, icon: FileCode, shortcut: "ts" },
    { label: "Python", description: "Python code block", value: "```python\n\n```", offset: 10, icon: FileType, shortcut: "py" },
    { label: "Java", description: "Java code block", value: "```java\n\n```", offset: 8, icon: Coffee, shortcut: "java" },
    { label: "React / TSX", description: "React component", value: "```tsx\n\n```", offset: 7, icon: Braces, shortcut: "tsx" },
    { label: "HTML", description: "HTML structure", value: "```html\n\n```", offset: 8, icon: Code2, shortcut: "html" },
    { label: "CSS", description: "CSS styles", value: "```css\n\n```", offset: 7, icon: Code2, shortcut: "css" },
    { label: "JSON", description: "JSON data", value: "```json\n\n```", offset: 8, icon: FileJson, shortcut: "json" },
    { label: "Markdown", description: "Markdown example", value: "```markdown\n\n```", offset: 12, icon: FileType, shortcut: "md" },
];

const FONT_OPTIONS = [
  { label: "Default", value: "inherit" },
  { label: "Sans Serif", value: "Inter, sans-serif" },
  { label: "Serif", value: "Merriweather, serif" },
  { label: "Monospace", value: "'JetBrains Mono', monospace" },
];

const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "16px" },
  { label: "Medium", value: "18px" },
  { label: "Large", value: "24px" },
];

const lightThemes: Record<ColorTheme, ThemeColors> = {
  light: {
    appBg: "bg-white",
    text: "text-slate-900",
    mutedText: "text-slate-400",
    border: "border-gray-200",
    highlight: "bg-indigo-50 text-indigo-700",
    codeBlockBg: "#f8fafc",
    proseClass: "prose-slate",
    menuBg: "bg-white",
    menuHover: "bg-slate-100",
  },
  nord: {
    appBg: "bg-[#ECEFF4]",
    text: "text-[#2E3440]",
    mutedText: "text-[#4C566A]",
    border: "border-[#D8DEE9]",
    highlight: "bg-[#88C0D0]/10 text-[#5E81AC]",
    codeBlockBg: "#E5E9F0",
    proseClass: "prose-slate",
    menuBg: "bg-[#E5E9F0]",
    menuHover: "bg-[#D8DEE9]",
  },
  slate: {
    appBg: "bg-[#fdfbf7]",
    text: "text-stone-800",
    mutedText: "text-stone-400",
    border: "border-stone-200",
    highlight: "bg-stone-200/50 text-stone-900",
    codeBlockBg: "#f5f5f4",
    proseClass: "prose-stone",
    menuBg: "bg-[#fdfbf7]",
    menuHover: "bg-stone-100",
  },
  ocean: {
    appBg: "bg-blue-50/30",
    text: "text-slate-900",
    mutedText: "text-slate-400",
    border: "border-blue-100",
    highlight: "bg-blue-100 text-blue-700",
    codeBlockBg: "#f0f9ff",
    proseClass: "prose-blue",
    menuBg: "bg-white",
    menuHover: "bg-blue-50",
  },
};

const darkThemes: Record<ColorTheme, ThemeColors> = {
  light: {
    appBg: "bg-zinc-950",
    text: "text-zinc-100",
    mutedText: "text-zinc-500",
    border: "border-zinc-800",
    highlight: "bg-indigo-500/20 text-indigo-300",
    codeBlockBg: "#18181b",
    proseClass: "prose-invert",
    menuBg: "bg-zinc-900",
    menuHover: "bg-zinc-800",
  },
  nord: {
    appBg: "bg-[#2E3440]",
    text: "text-[#ECEFF4]",
    mutedText: "text-[#D8DEE9]",
    border: "border-[#434C5E]",
    highlight: "bg-[#88C0D0]/20 text-[#88C0D0]",
    codeBlockBg: "#242933",
    proseClass: "prose-invert",
    menuBg: "bg-[#2E3440]",
    menuHover: "bg-[#3B4252]",
  },
  slate: {
    appBg: "bg-[#1c1917]",
    text: "text-[#e7e5e4]",
    mutedText: "text-[#78716c]",
    border: "border-[#292524]",
    highlight: "bg-[#44403c] text-[#fafaf9]",
    codeBlockBg: "#0c0a09",
    proseClass: "prose-invert",
    menuBg: "bg-[#1c1917]",
    menuHover: "bg-[#292524]",
  },
  ocean: {
    appBg: "bg-[#0f172a]",
    text: "text-[#f1f5f9]",
    mutedText: "text-[#94a3b8]",
    border: "border-[#334155]",
    highlight: "bg-[#38bdf8]/20 text-[#38bdf8]",
    codeBlockBg: "#020617",
    proseClass: "prose-invert",
    menuBg: "bg-[#0f172a]",
    menuHover: "bg-[#1e293b]",
  },
};

// ------------------------------------------------------------------
// 3. Helper Functions & Components
// ------------------------------------------------------------------

function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);

    Array.from(style).forEach((prop) => {
        div.style.setProperty(prop, style.getPropertyValue(prop));
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.overflow = 'hidden';
    div.textContent = element.value.substring(0, position);

    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);

    document.body.appendChild(div);
    const { offsetLeft, offsetTop } = span;
    document.body.removeChild(div);

    const rect = element.getBoundingClientRect();
    return {
        left: rect.left + offsetLeft - element.scrollLeft,
        top: rect.top + offsetTop - element.scrollTop
    };
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

function CopyButton({
  content,
  isDarkMode,
}: {
  content: string;
  language?: string;
  isDarkMode: boolean;
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
      className={cn(
        "absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200",
        isDarkMode
          ? "bg-white/10 hover:bg-white/20 text-gray-300"
          : "bg-black/5 hover:bg-black/10 text-gray-600"
      )}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" /> 
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
  
  const content = extractTextContent(children).replace(/\n$/, "");
  const colors = isDarkMode ? darkThemes[theme] : lightThemes[theme];

  if (isInline) {
    return (
      <code
        {...rest}
        className={cn(
          "px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border font-medium",
          isDarkMode
            ? "bg-white/10 border-white/10 text-pink-300"
            : "bg-slate-100 border-slate-200 text-pink-600"
        )}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-6 rounded-lg overflow-hidden border border-transparent shadow-sm">
      <div className={cn(
        "flex items-center justify-between px-4 py-2 text-xs font-mono border-b select-none",
         isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"
      )}>
        <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            <span className="uppercase tracking-wider">{language || "text"}</span>
        </div>
      </div>
      
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
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: colors.codeBlockBg,
          fontSize: "14px",
          lineHeight: "1.6",
          padding: "1.5rem",
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

// ------------------------------------------------------------------
// 4. Main Component
// ------------------------------------------------------------------

export function Editor({ canvasId, initialContent }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [colorTheme, setColorTheme] = useState<ColorTheme>("light");
  const [isDragging, setIsDragging] = useState(false);

  // Slash Command State
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { socket, isConnected } = useSocket(canvasId);

  const isLocalChange = useRef(false);
  const debouncedContent = useDebounce(content, 500);
  const themeColors = isDarkMode ? darkThemes[colorTheme] : lightThemes[colorTheme];

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

  // Slash Command Filtering
  const filteredCommands = useMemo(() => {
      if(!slashFilter) return SLASH_COMMANDS;
      const lowerFilter = slashFilter.toLowerCase();
      
      return SLASH_COMMANDS.filter(cmd => 
        cmd.label.toLowerCase().includes(lowerFilter) || 
        cmd.shortcut?.toLowerCase().includes(lowerFilter)
      );
  }, [slashFilter]);

  // Insert HTML util
  const insertHtmlTag = (prefix: string, suffix: string, blockMode: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = content.substring(selectionStart, selectionEnd);
    
    const pre = blockMode ? `\n\n${prefix}` : prefix;
    const suf = blockMode ? `${suffix}\n\n` : suffix;

    const newText = pre + selectedText + suf;
    const newContent =
      content.substring(0, selectionStart) +
      newText +
      content.substring(selectionEnd);

    setContent(newContent);
    isLocalChange.current = true;

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.selectionStart = selectionStart;
        textarea.selectionEnd = selectionEnd + pre.length + suf.length;
      } else {
        textarea.selectionStart = selectionStart + pre.length;
        textarea.selectionEnd = selectionStart + pre.length;
      }
    }, 0);
  };

  const executeSlashCommand = (cmd: CommandItem) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart } = textarea;
      
      const textBeforeCursor = content.substring(0, selectionStart);
      const lastSlashIndex = textBeforeCursor.lastIndexOf("/");
      
      if (lastSlashIndex === -1) return;

      const beforeSlash = content.substring(0, lastSlashIndex);
      const afterCursor = content.substring(selectionStart);
      
      const newContent = beforeSlash + cmd.value + afterCursor;

      setContent(newContent);
      setShowSlashMenu(false);
      setSlashFilter("");
      isLocalChange.current = true;

      setTimeout(() => {
          textarea.focus();
          const newPos = lastSlashIndex + cmd.offset;
          textarea.selectionStart = textarea.selectionEnd = newPos;
      }, 0);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const textarea = textareaRef.current;
    
    let insertPos = textarea ? textarea.selectionStart : content.length;
    if (!isEditMode) setIsEditMode(true);

    setTimeout(async () => {
        const currentTextarea = textareaRef.current;
        if (currentTextarea) {
            insertPos = currentTextarea.selectionStart;
        }

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                const imageMarkdown = `\n![${file.name}](${base64})\n`;
                insertTextAtPosition(imageMarkdown, insertPos);
            };
            reader.readAsDataURL(file);
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                let importedContent = text;
                
                const codeExtensions = ['js', 'ts', 'py', 'java', 'c', 'cpp', 'json', 'html', 'css'];
                if (codeExtensions.includes(fileExtension || '')) {
                      importedContent = `\n\`\`\`${fileExtension}\n${text}\n\`\`\`\n`;
                } else {
                      importedContent = `\n${text}\n`;
                }

                insertTextAtPosition(importedContent, insertPos);
            };
            reader.readAsText(file);
        }
    }, 50);
  };

  const insertTextAtPosition = (text: string, position: number) => {
      const before = content.substring(0, position);
      const after = content.substring(position);
      const newContent = before + text + after;
      setContent(newContent);
      isLocalChange.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    if (showSlashMenu) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSlashSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setSlashSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            if (filteredCommands[slashSelectedIndex]) {
                executeSlashCommand(filteredCommands[slashSelectedIndex]);
            }
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            setShowSlashMenu(false);
            return;
        }
    }

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

    if (e.key === "Enter" && !showSlashMenu) {
      const beforeCursor = content.substring(0, selectionStart);
      const lines = beforeCursor.split("\n");
      const currentLine = lines[lines.length - 1];

      if (currentLine.match(/^\s*[\*\-\+]\s/)) {
        e.preventDefault();
        const match = currentLine.match(/^(\s*)([\*\-\+]\s)/);
        if (match) {
          const indent = match[1];
          const bullet = match[2];
          const textAfterBullet = currentLine.replace(match[0], "").trim();
          
          if (!textAfterBullet) {
             const newContent = content.substring(0, selectionStart - bullet.length - indent.length) + "\n" + content.substring(selectionEnd);
             setContent(newContent);
             return;
          }

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
          const textAfterNum = currentLine.replace(match[0], "").trim();

           if (!textAfterNum) {
             const newContent = content.substring(0, selectionStart - match[0].length) + "\n" + content.substring(selectionEnd);
             setContent(newContent);
             return;
          }

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

    const beforeCursor = newValue.substring(0, selectionStart);
    const lastSlash = beforeCursor.lastIndexOf("/");
    
    if (lastSlash !== -1) {
        const textAfterSlash = beforeCursor.substring(lastSlash + 1);
        const charBeforeSlash = beforeCursor[lastSlash - 1];
        
        if (
            (!charBeforeSlash || charBeforeSlash === " " || charBeforeSlash === "\n") && 
            !textAfterSlash.includes(" ") &&
            !textAfterSlash.includes("\n")
        ) {
             if (!showSlashMenu) {
                 const coords = getCaretCoordinates(textarea, selectionStart);
                 setSlashMenuPos({ top: coords.top + 24, left: coords.left });
                 setShowSlashMenu(true);
             }
             setSlashFilter(textAfterSlash);
             setSlashSelectedIndex(0);
        } else {
            setShowSlashMenu(false);
        }
    } else {
        setShowSlashMenu(false);
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
      return `Type '/' for commands...`;
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
        if (computedStyle.color) htmlElement.style.color = computedStyle.color;
        if (computedStyle.backgroundColor) htmlElement.style.backgroundColor = computedStyle.backgroundColor;
        if (computedStyle.fontFamily) htmlElement.style.fontFamily = computedStyle.fontFamily;
      });

      const previewContent = clonedContent.innerHTML;
      const printWindow = window.open("", "_blank");
      
      if (!printWindow) throw new Error("Please allow pop-ups to export PDF");
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${canvasId || 'Document'}</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
            <style>
              body { font-family: -apple-system, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
              img { max-width: 100%; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
              code { font-family: monospace; background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
              blockquote { border-left: 4px solid #ddd; padding-left: 15px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              @media print { body { padding: 0; } }
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
        }, 500);
      };
    } catch (error) {
      console.error(error);
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
        alert("PDF import requires pdf.js library.");
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
            if (['txt', 'md', 'markdown'].includes(fileExtension || '')) {
                 importedContent = `\n\n${text}\n\n`;
            } else {
                 importedContent = `\n\n\`\`\`${fileExtension}\n${text}\n\`\`\`\n\n`;
            }

            const { selectionStart } = textarea;
            const beforeCursor = content.substring(0, selectionStart);
            const afterCursor = content.substring(selectionStart);
            const newContent = beforeCursor + importedContent + afterCursor;
            
            setContent(newContent);
            isLocalChange.current = true;
          }
        };
        reader.readAsText(file);
      } else {
        alert(`Unsupported file type.`);
      }
    } catch (error) {
      console.error(error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileImport = () => {
    fileInputRef.current?.click();
  };

  const FormattingToolbar = () => (
    <div className={cn(
        "sticky top-0 z-10 flex flex-wrap items-center gap-1.5 p-2 border-b backdrop-blur-md transition-colors duration-300",
        isDarkMode 
            ? "bg-black/60 border-white/5" 
            : "bg-white/80 border-gray-100"
    )}>
        {/* Alignment */}
        <div className="flex items-center rounded-lg overflow-hidden bg-transparent p-0.5 gap-0.5">
            {[
                { icon: AlignLeft, action: () => insertHtmlTag('<div style="text-align: left">', '</div>', true) },
                { icon: AlignCenter, action: () => insertHtmlTag('<div style="text-align: center">', '</div>', true) },
                { icon: AlignRight, action: () => insertHtmlTag('<div style="text-align: right">', '</div>', true) },
                { icon: AlignJustify, action: () => insertHtmlTag('<div style="text-align: justify">', '</div>', true) },
            ].map((tool, i) => (
                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={tool.action}>
                    <tool.icon className={cn("h-3.5 w-3.5", themeColors.mutedText)} />
                </Button>
            ))}
        </div>

        <div className={cn("h-4 w-[1px] mx-1", themeColors.border)} />

        {/* Font Family */}
        <Select onValueChange={(value) => insertHtmlTag(`<span style="font-family: ${value}">`, '</span>')}>
            <SelectTrigger className="h-7 w-[110px] text-xs border-0 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 focus:ring-0">
                <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
                {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        {/* Font Size */}
        <Select onValueChange={(value) => insertHtmlTag(`<span style="font-size: ${value}">`, '</span>')}>
            <SelectTrigger className="h-7 w-[90px] text-xs border-0 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 focus:ring-0">
                <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
                {FONT_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                        {size.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        <div className={cn("h-4 w-[1px] mx-1", themeColors.border)} />

        {/* Colors */}
        <div className="flex items-center gap-1">
             <div className="relative group">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => document.getElementById("text-color-picker")?.click()}>
                    <Baseline className={cn("h-3.5 w-3.5", themeColors.mutedText)} />
                </Button>
                <input type="color" id="text-color-picker" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => insertHtmlTag(`<span style="color: ${e.target.value}">`, '</span>')} />
             </div>
             <div className="relative group">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => document.getElementById("bg-color-picker")?.click()}>
                    <Highlighter className={cn("h-3.5 w-3.5", themeColors.mutedText)} />
                </Button>
                <input type="color" id="bg-color-picker" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => insertHtmlTag(`<span style="background-color: ${e.target.value}">`, '</span>')} />
             </div>
        </div>

         <div className={cn("h-4 w-[1px] mx-1", themeColors.border)} />

        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => insertHtmlTag('\n$$\n', '\n$$\n', false)}>
            <Sigma className={cn("h-3.5 w-3.5", themeColors.mutedText)} />
        </Button>
    </div>
  );

  const PreviewContent = () => (
    <article
      ref={previewRef}
      onDoubleClick={() => setIsEditMode(true)}
      className={cn(
        "prose max-w-none p-8 sm:p-12 transition-all duration-300",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-p:leading-relaxed prose-li:my-1",
        "prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0", 
        themeColors.proseClass,
        "cursor-text min-h-[500px]"
      )}
    >
      {content.trim() ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            code: (props) => (
              <CodeBlock {...props} isDarkMode={isDarkMode} theme={colorTheme} />
            ),
            blockquote: (props) => (
                <div className="relative group my-6 pl-4 border-l-2 border-indigo-500/50 italic opacity-80">
                   {props.children}
                </div>
            ),
            table: (props) => (
                <div className="overflow-x-auto my-6 rounded-lg border border-opacity-50">
                    <table className="w-full text-sm text-left">
                        {props.children}
                    </table>
                </div>
            ),
            th: ({children}) => <th className="px-6 py-3 bg-gray-50 dark:bg-white/5 font-medium uppercase tracking-wider text-xs">{children}</th>,
            td: ({children}) => <td className="px-6 py-4 border-t border-gray-100 dark:border-white/5">{children}</td>
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 opacity-40">
           <Edit3 className="w-12 h-12 mb-4" strokeWidth={1.5} />
           <p className="text-sm font-medium">Start writing to preview content...</p>
        </div>
      )}
    </article>
  );

  return (
    <div
      className={cn(
        "flex flex-col h-screen w-full relative transition-colors duration-500 overflow-hidden",
        themeColors.appBg
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.rs,.go,.yml,.yaml,.json,.xml,.html,.css,.scss,.pdf"
        onChange={handleImportFile}
        className="hidden"
      />

      <header className={cn(
          "flex-none px-6 py-3 flex items-center justify-between border-b sticky top-0 z-50 backdrop-blur-xl",
          isDarkMode ? "bg-black/40 border-white/5" : "bg-white/60 border-gray-200/50"
      )}>
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                 <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-rose-500")} />
                 <span className={cn("text-xs font-medium uppercase tracking-widest opacity-60", themeColors.text)}>
                    {isConnected ? "Live" : "Offline"}
                 </span>
              </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                   <Palette className="h-4 w-4" />
                   <span className="text-xs">Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                  {(["light", "nord", "slate", "ocean"] as ColorTheme[]).map((t) => (
                      <DropdownMenuItem key={t} onClick={() => setColorTheme(t)} className="capitalize">
                          {t}
                      </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="h-8 w-8 text-muted-foreground">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className={cn("h-4 w-[1px] opacity-20 mx-1", isDarkMode ? "bg-white" : "bg-black")} />

            <Button variant="ghost" size="sm" onClick={triggerFileImport} className="h-8 text-muted-foreground">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>

             <Button variant="ghost" size="sm" onClick={exportToPDF} disabled={isExporting} className="h-8 text-muted-foreground">
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "..." : "Export"}
            </Button>

            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              size="sm"
              className={cn(
                "ml-2 h-8 px-4 transition-all shadow-sm font-medium",
                isDarkMode 
                    ? "bg-white text-black hover:bg-gray-200" 
                    : "bg-black text-white hover:bg-gray-800"
              )}
            >
              {isEditMode ? (
                <>
                  <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                </>
              )}
            </Button>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto relative scroll-smooth flex flex-col">
         <div className={cn(
             "flex-1 w-full h-full transition-all duration-500 ease-out",
             themeColors.appBg,
             themeColors.text
         )}>
            {isEditMode ? (
              <div className="flex flex-col min-h-full relative">
                <FormattingToolbar />
                
                <div className="relative flex-1 group">
                  <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={() => {}}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                    className={cn(
                      "w-full h-full min-h-[calc(100vh-140px)] p-8 sm:p-12 resize-none bg-transparent border-0 focus-visible:ring-0 font-mono text-base leading-7 selection:bg-indigo-500/20",
                      themeColors.text,
                      "placeholder:opacity-30 outline-none"
                    )}
                    spellCheck={false}
                    placeholder=""
                  />
                   {!content.trim() && (
                    <div className={cn(
                        "absolute top-12 left-12 pointer-events-none opacity-40 font-mono text-sm",
                         themeColors.mutedText
                    )}>
                        {getPlaceholderText()}
                    </div>
                  )}

                  {showSlashMenu && (
                      <div 
                        className={cn(
                            "absolute z-50 w-72 rounded-lg shadow-2xl overflow-hidden border animate-in fade-in zoom-in-95 duration-100",
                            themeColors.menuBg,
                            themeColors.border
                        )}
                        style={{
                            top: slashMenuPos.top,
                            left: slashMenuPos.left
                        }}
                      >
                         <div className="px-3 py-2 text-xs font-semibold opacity-50 uppercase tracking-wider border-b">
                            Block / Command
                         </div>
                         <div className="max-h-[300px] overflow-y-auto py-1">
                             {filteredCommands.length > 0 ? (
                                 filteredCommands.map((cmd, index) => (
                                     <button
                                        key={cmd.label}
                                        onClick={() => executeSlashCommand(cmd)}
                                        className={cn(
                                            "w-full px-3 py-2 text-left flex items-center gap-3 transition-colors",
                                            index === slashSelectedIndex ? themeColors.menuHover : "bg-transparent",
                                            themeColors.text
                                        )}
                                     >
                                         <div className="p-1 rounded border opacity-70">
                                            <cmd.icon className="w-4 h-4" />
                                         </div>
                                         <div className="flex flex-col">
                                             <div className="flex items-center gap-2">
                                                 <span className="text-sm font-medium">{cmd.label}</span>
                                                 {cmd.shortcut && slashFilter && (
                                                     <span className="text-[10px] uppercase bg-indigo-500/20 px-1 rounded text-indigo-500">
                                                        /{cmd.shortcut}
                                                     </span>
                                                 )}
                                             </div>
                                             <span className="text-xs opacity-50">{cmd.description}</span>
                                         </div>
                                     </button>
                                 ))
                             ) : (
                                 <div className="px-4 py-3 text-sm opacity-50 text-center">
                                     No commands found
                                 </div>
                             )}
                         </div>
                      </div>
                  )}

                </div>
              </div>
            ) : (
              <PreviewContent />
            )}
         </div>
      </main>
    </div>
  );
}

export default Editor;