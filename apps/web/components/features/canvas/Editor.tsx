"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type DragEvent,
} from "react";
import {
  Copy,
  Check,
  Download,
  Upload,
  Moon,
  Sun,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Link,
  Type,
  Sigma,
  Terminal,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
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
  Minus,
  Strikethrough,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";
import "katex/dist/katex.min.css";

marked.use(markedKatex({ throwOnError: false }));

import { useSocket } from "@/hooks/useSocket";
import { useDebounce } from "@/hooks/useDebounce";
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

// Removed internal theme maps. Relying on global Tailwind `.dark` classes point-forward.

interface CommandItem {
  label: string;
  description: string;
  action: (editor: HTMLDivElement) => void;
  icon: React.ElementType;
  shortcut?: string;
}

// ------------------------------------------------------------------
// 2. Constants
// ------------------------------------------------------------------

const FONT_OPTIONS = [
  { label: "Default (Sans)", value: "Inter, system-ui, sans-serif" },
  { label: "Serif", value: "Merriweather, Georgia, serif" },
  { label: "Monospace", value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
];

const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "0.875em" },
  { label: "Normal", value: "1em" },
  { label: "Medium", value: "1.125em" },
  { label: "Large", value: "1.5em" },
  { label: "X-Large", value: "2em" },
];

// ------------------------------------------------------------------
// 3. Slash Commands (block-level insertions)
// ------------------------------------------------------------------

function insertBlockAtCursor(editor: HTMLDivElement, html: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);

  // Delete the slash trigger text (e.g. "/js")
  const node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    const slashIdx = text.lastIndexOf("/");
    if (slashIdx !== -1) {
      (node as Text).deleteData(slashIdx, text.length - slashIdx);
    }
  }

  // Create and insert the block
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const frag = document.createDocumentFragment();
  let lastNode: Node | null = null;
  while (temp.firstChild) {
    lastNode = frag.appendChild(temp.firstChild);
  }
  range.insertNode(frag);

  // Place cursor after inserted content
  if (lastNode) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  editor.focus();
}

const SLASH_COMMANDS: CommandItem[] = [
  {
    label: "Heading 1",
    description: "Big section heading",
    icon: Heading1,
    action: (ed) => {
      document.execCommand("formatBlock", false, "h1");
      ed.focus();
    },
  },
  {
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    action: (ed) => {
      document.execCommand("formatBlock", false, "h2");
      ed.focus();
    },
  },
  {
    label: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    action: (ed) => {
      document.execCommand("formatBlock", false, "h3");
      ed.focus();
    },
  },
  {
    label: "Bullet List",
    description: "Create a simple list",
    icon: List,
    action: (ed) => {
      document.execCommand("insertUnorderedList", false);
      ed.focus();
    },
  },
  {
    label: "Numbered List",
    description: "Create a numbered list",
    icon: ListOrdered,
    action: (ed) => {
      document.execCommand("insertOrderedList", false);
      ed.focus();
    },
  },
  {
    label: "To-do List",
    description: "Track tasks with checkboxes",
    icon: ListTodo,
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<div class="ps-todo" contenteditable="true"><label><input type="checkbox" /> <span>Task item</span></label></div><p><br></p>`
      ),
  },
  {
    label: "Quote",
    description: "Capture a quote",
    icon: Quote,
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<blockquote class="ps-blockquote"><p>Quote text...</p></blockquote><p><br></p>`
      ),
  },
  {
    label: "Divider",
    description: "Insert a horizontal rule",
    icon: Minus,
    action: (ed) => {
      document.execCommand("insertHorizontalRule", false);
      ed.focus();
    },
  },
  {
    label: "Table",
    description: "Insert a table",
    icon: TableIcon,
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<table class="ps-table"><thead><tr><th>Header</th><th>Header</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p><br></p>`
      ),
  },
  {
    label: "Math (KaTeX)",
    description: "Insert a math equation block",
    icon: Sigma,
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<div class="ps-math" contenteditable="true" data-placeholder="Enter LaTeX equation...">E = mc^2</div><p><br></p>`
      ),
  },
  {
    label: "Image",
    description: "Insert image from URL",
    icon: ImageIcon,
    action: (ed) => {
      const url = prompt("Enter Image URL:");
      if (url) {
        insertBlockAtCursor(
          ed,
          `<img src="${url}" alt="Image" class="ps-image" /><p><br></p>`
        );
      }
    },
  },
  {
    label: "Code Block",
    description: "Generic code snippet",
    icon: Code2,
    shortcut: "code",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="text"><code contenteditable="true">// code here</code></pre><p><br></p>`
      ),
  },
  {
    label: "JavaScript",
    description: "JS code block",
    icon: FileCode,
    shortcut: "js",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="javascript"><code contenteditable="true">// JavaScript</code></pre><p><br></p>`
      ),
  },
  {
    label: "TypeScript",
    description: "TS code block",
    icon: FileCode,
    shortcut: "ts",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="typescript"><code contenteditable="true">// TypeScript</code></pre><p><br></p>`
      ),
  },
  {
    label: "Python",
    description: "Python code block",
    icon: FileType,
    shortcut: "py",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="python"><code contenteditable="true"># Python</code></pre><p><br></p>`
      ),
  },
  {
    label: "Java",
    description: "Java code block",
    icon: Coffee,
    shortcut: "java",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="java"><code contenteditable="true">// Java</code></pre><p><br></p>`
      ),
  },
  {
    label: "React / TSX",
    description: "React component",
    icon: Braces,
    shortcut: "tsx",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="tsx"><code contenteditable="true">// React TSX</code></pre><p><br></p>`
      ),
  },
  {
    label: "HTML",
    description: "HTML structure",
    icon: Code2,
    shortcut: "html",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="html"><code contenteditable="true">&lt;!-- HTML --&gt;</code></pre><p><br></p>`
      ),
  },
  {
    label: "CSS",
    description: "CSS styles",
    icon: Code2,
    shortcut: "css",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="css"><code contenteditable="true">/* CSS */</code></pre><p><br></p>`
      ),
  },
  {
    label: "JSON",
    description: "JSON data",
    icon: FileJson,
    shortcut: "json",
    action: (ed) =>
      insertBlockAtCursor(
        ed,
        `<pre class="ps-codeblock" data-language="json"><code contenteditable="true">{}</code></pre><p><br></p>`
      ),
  },
];

// ------------------------------------------------------------------
// 4. Helpers
// ------------------------------------------------------------------

/** Convert legacy Markdown content to basic HTML for migration */
function markdownToBasicHtml(md: string): string {
  if (!md || !md.trim()) return "<p><br></p>";

  // If it already looks like HTML (has tags) and not raw markdown snippets, return as-is
  if (/<[a-z][\s\S]*>/i.test(md) && !md.startsWith("#") && !md.startsWith("-") && !md.startsWith("```")) {
    return md;
  }

  try {
    // Configure marked for GF-Markdown including breaks
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    
    // Parse markdown to HTML string synchronously
    let html = marked.parse(md) as string;

    // Post-process HTML to inject custom Pagesmith classes for WYSIWYG rendering
    // 1. Code blocks (marked outputs <pre><code class="language-xyz">)
    html = html.replace(/<pre><code class="language-([^"]+)">/g, '<pre class="ps-codeblock" data-language="$1"><code>');
    html = html.replace(/<pre><code>/g, '<pre class="ps-codeblock" data-language="text"><code>');
    
    // 2. Blockquotes
    html = html.replace(/<blockquote>/g, '<blockquote class="ps-blockquote">');
    
    // 3. Tables
    html = html.replace(/<table>/g, '<table class="ps-table">');
    
    // 4. Images
    html = html.replace(/<img /g, '<img class="ps-image" ');

    // Filter out top-level empty wrap spaces
    if (!html.trim()) return "<p><br></p>";
    return html;
  } catch (error) {
    console.error("Failed to parse markdown:", error);
    return `<p>${md.replace(/\n/g, '<br>')}</p>`;
  }
}

/** Get caret position in viewport coordinates */
function getCaretRect(): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  // For collapsed caret at end of line, rect may be zero-sized
  if (rect.width === 0 && rect.height === 0) {
    const span = document.createElement("span");
    span.textContent = "\u200b"; // zero-width space
    range.insertNode(span);
    const spanRect = span.getBoundingClientRect();
    span.parentNode?.removeChild(span);
    // Normalize DOM after removing span
    sel.getRangeAt(0).collapse(true);
    return spanRect;
  }
  return rect;
}

// ------------------------------------------------------------------
// 5. Main Component
// ------------------------------------------------------------------

export function Editor({ canvasId, initialContent }: EditorProps) {
  const [content, setContent] = useState(() =>
    markdownToBasicHtml(initialContent)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Slash Command State
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  // Floating Toolbar State
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState({
    top: 0,
    left: 0,
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { socket, isConnected } = useSocket(canvasId);

  const isLocalChange = useRef(false);
  const isRemoteUpdate = useRef(false);
  const debouncedContent = useDebounce(content, 500);

  // ---- Socket Sync ----
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (newContent: string) => {
      isRemoteUpdate.current = true;
      isLocalChange.current = false;
      setContent(newContent);
    };
    socket.on("canvas-updated", handleUpdate);
    return () => {
      socket.off("canvas-updated", handleUpdate);
    };
  }, [socket]);

  // Apply remote content updates to the contentEditable div
  useEffect(() => {
    if (isRemoteUpdate.current && editorRef.current) {
      // Save/restore selection is tricky — for remote updates, just set innerHTML
      editorRef.current.innerHTML = content;
      isRemoteUpdate.current = false;
    }
  }, [content]);

  useEffect(() => {
    if (isConnected && socket && isLocalChange.current) {
      socket.emit("canvas-update", { canvasId, content: debouncedContent });
      isLocalChange.current = false;
    }
  }, [debouncedContent, canvasId, isConnected, socket]);

  // Initialize editor content on mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Enhance code blocks with language badge + copy button ----
  const enhanceCodeBlocks = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const blocks = editor.querySelectorAll('pre.ps-codeblock');
    blocks.forEach((block) => {
      if (block.querySelector('.ps-cb-header')) return; // already enhanced
      const lang = block.getAttribute('data-language') || 'text';
      const header = document.createElement('div');
      header.className = 'ps-cb-header';
      header.contentEditable = 'false';
      header.innerHTML = `<span class="ps-cb-lang">${lang.toUpperCase()}</span><button class="ps-cb-copy" title="Copy code">Copy</button>`;
      block.insertBefore(header, block.firstChild);
      const copyBtn = header.querySelector('.ps-cb-copy');
      copyBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const code = block.querySelector('code');
        const text = code?.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
          if (copyBtn) { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000); }
        });
      });
    });
  }, []);

  useEffect(() => {
    enhanceCodeBlocks();
  }, [content, enhanceCodeBlocks]);

  // ---- Fullscreen toggle with Escape key ----
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  // ---- Slash Command Filtering ----
  const filteredCommands = useMemo(() => {
    if (!slashFilter) return SLASH_COMMANDS;
    const lower = slashFilter.toLowerCase();
    return SLASH_COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.shortcut?.toLowerCase().includes(lower)
    );
  }, [slashFilter]);

  // ---- Execute slash command ----
  const executeSlashCommand = useCallback(
    (cmd: CommandItem) => {
      const editor = editorRef.current;
      if (!editor) return;
      cmd.action(editor);
      setShowSlashMenu(false);
      setSlashFilter("");
      isLocalChange.current = true;
      // Sync content after command execution
      setTimeout(() => {
        if (editorRef.current) {
          setContent(editorRef.current.innerHTML);
        }
      }, 10);
    },
    []
  );

  // ---- Detect slash commands in contentEditable ----
  const checkForSlashCommand = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
      setShowSlashMenu(false);
      return;
    }

    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) {
      setShowSlashMenu(false);
      return;
    }

    const text = node.textContent || "";
    const offset = sel.anchorOffset;
    const textBeforeCursor = text.substring(0, offset);

    const slashIdx = textBeforeCursor.lastIndexOf("/");
    if (slashIdx === -1) {
      setShowSlashMenu(false);
      return;
    }

    const charBefore = textBeforeCursor[slashIdx - 1];
    if (charBefore && charBefore !== " " && charBefore !== "\n") {
      setShowSlashMenu(false);
      return;
    }

    const filter = textBeforeCursor.substring(slashIdx + 1);
    if (filter.includes(" ") || filter.includes("\n")) {
      setShowSlashMenu(false);
      return;
    }

    // Position the menu
    const caretRect = getCaretRect();
    if (caretRect) {
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (editorRect) {
        setSlashMenuPos({
          top: caretRect.bottom - editorRect.top + 8,
          left: caretRect.left - editorRect.left,
        });
      }
    }

    setSlashFilter(filter);
    setSlashSelectedIndex(0);
    setShowSlashMenu(true);
  }, []);

  // ---- Floating toolbar on selection ----
  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setShowFloatingToolbar(false);
      return;
    }

    // Only show toolbar if selection is inside the editor
    const editor = editorRef.current;
    if (
      !editor ||
      !editor.contains(sel.anchorNode) ||
      !editor.contains(sel.focusNode)
    ) {
      setShowFloatingToolbar(false);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();

    setFloatingToolbarPos({
      top: rect.top - editorRect.top - 52,
      left: rect.left - editorRect.left + rect.width / 2,
    });
    setShowFloatingToolbar(true);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", checkSelection);
    return () =>
      document.removeEventListener("selectionchange", checkSelection);
  }, [checkSelection]);

  // ---- Editor input handler ----
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContent(html);
    isLocalChange.current = true;
    checkForSlashCommand();
  }, [checkForSlashCommand]);

  // ---- Keyboard handling ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (showSlashMenu) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashSelectedIndex(
            (prev) => (prev + 1) % filteredCommands.length
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashSelectedIndex(
            (prev) =>
              (prev - 1 + filteredCommands.length) % filteredCommands.length
          );
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

      // Tab indentation
      if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "  ");
        return;
      }

      // Keyboard shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "b":
            e.preventDefault();
            document.execCommand("bold", false);
            break;
          case "i":
            e.preventDefault();
            document.execCommand("italic", false);
            break;
          case "u":
            e.preventDefault();
            document.execCommand("underline", false);
            break;
          case "k":
            e.preventDefault();
            {
              const url = prompt("Enter URL:");
              if (url) {
                document.execCommand("createLink", false, url);
              }
            }
            break;
        }
      }
    },
    [
      showSlashMenu,
      filteredCommands,
      slashSelectedIndex,
      executeSlashCommand,
    ]
  );

  // ---- Paste handling for Markdown (e.g. from AI) ----
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    
    // Parse the raw markdown into HTML
    const html = markdownToBasicHtml(text);
    
    // Insert the parsed HTML
    document.execCommand("insertHTML", false, html);
    
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      isLocalChange.current = true;
    }
  }, []);

  // ---- Drag and Drop ----
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
    const editor = editorRef.current;
    if (!editor) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imgHtml = `<img src="${base64}" alt="${file.name}" class="ps-image" />`;
        editor.focus();
        document.execCommand("insertHTML", false, imgHtml);
        setContent(editor.innerHTML);
        isLocalChange.current = true;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const ext = file.name.split(".").pop()?.toLowerCase();
        const codeExts = [
          "js",
          "ts",
          "py",
          "java",
          "c",
          "cpp",
          "json",
          "html",
          "css",
        ];
        let insertHtml: string;

        if (codeExts.includes(ext || "")) {
          const escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          insertHtml = `<pre class="ps-codeblock" data-language="${ext}"><code>${escaped}</code></pre><p><br></p>`;
        } else {
          insertHtml = `<p>${text.replace(/\n/g, "<br>")}</p>`;
        }

        editor.focus();
        document.execCommand("insertHTML", false, insertHtml);
        setContent(editor.innerHTML);
        isLocalChange.current = true;
      };
      reader.readAsText(file);
    }
  };

  // ---- File import ----
  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const editor = editorRef.current;
    if (!editor) return;

    const validExts = [
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

    if (!validExts.includes(ext || "")) {
      alert("Unsupported file type.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      let insertHtml: string;
      if (["txt", "md", "markdown"].includes(ext || "")) {
        insertHtml = markdownToBasicHtml(text);
      } else {
        const escaped = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        insertHtml = `<pre class="ps-codeblock" data-language="${ext}"><code>${escaped}</code></pre>`;
      }

      editor.focus();
      document.execCommand("insertHTML", false, insertHtml);
      setContent(editor.innerHTML);
      isLocalChange.current = true;
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Export to PDF ----
  const exportToPDF = async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setIsExporting(true);
    try {
      const cloned = editor.cloneNode(true) as HTMLElement;
      const buttons = cloned.querySelectorAll("button");
      buttons.forEach((btn) => btn.remove());

      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Please allow pop-ups to export PDF");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${canvasId || "Document"}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&family=JetBrains+Mono:wght@400;500&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
            <style>
              body { font-family: 'Inter', sans-serif; line-height: 1.7; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
              img { max-width: 100%; border-radius: 8px; }
              pre { background: #f5f5f5; padding: 16px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; overflow-x: auto; }
              code { font-family: 'JetBrains Mono', monospace; }
              blockquote { border-left: 3px solid #6366f1; padding-left: 16px; color: #666; font-style: italic; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background: #f8f8f8; font-weight: 600; }
              h1, h2, h3 { font-weight: 700; letter-spacing: -0.02em; }
              hr { border: none; border-top: 2px solid #e5e7eb; margin: 24px 0; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${cloned.innerHTML}</body>
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

  // ---- Rendering ----
  return (
    <div
      className={cn(
        "flex flex-col w-full relative transition-colors duration-500 overflow-hidden",
        "bg-white dark:bg-black",
        isFullscreen
          ? "fixed inset-0 z-[9999] h-screen"
          : "h-full"
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

      {/* ====== HEADER / TOOLBAR ====== */}
      <header
        className={cn(
          "flex-none flex items-center justify-between px-3 sm:px-6 py-2.5 border-b bg-white dark:bg-black border-slate-200 dark:border-white/10 z-20 sticky top-0 backdrop-blur-xl transition-colors",
          isFullscreen ? "fixed top-0 left-0 right-0 bg-white/80 dark:bg-black/80 shadow-sm" : ""
        )}
      >
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap flex-1 min-w-0">
          {/* Quick formatting buttons */}
          <div className="flex items-center gap-0.5 mr-1 flex-shrink-0 bg-slate-100 dark:bg-white/5 rounded-md p-1 border border-slate-200 dark:border-white/10">
            {[
              { icon: Bold, action: () => document.execCommand("bold"), title: "Bold" },
              { icon: Italic, action: () => document.execCommand("italic"), title: "Italic" },
              { icon: Underline, action: () => document.execCommand("underline"), title: "Underline" },
              {
                icon: Link,
                title: "Link",
                action: () => {
                  const url = prompt("Enter URL:");
                  if (url) document.execCommand("createLink", false, url);
                },
              },
            ].map((tool, i) => (
              <Button
                key={i} variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" title={tool.title}
                onClick={(e) => { e.preventDefault(); editorRef.current?.focus(); tool.action(); setTimeout(() => { if (editorRef.current) { setContent(editorRef.current.innerHTML); isLocalChange.current = true; } }, 0); }}
              >
                <tool.icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/20 mx-1 flex-shrink-0" />

          {/* More Tools Dropdown for responsiveness */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <span className="hidden sm:inline">More</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px] z-50 bg-white dark:bg-neutral-900 border-slate-200 dark:border-white/10 shadow-xl rounded-xl">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">Alignment</div>
              <div className="flex px-2 gap-1 mb-2">
                {[
                  { icon: AlignLeft, action: () => document.execCommand("justifyLeft") },
                  { icon: AlignCenter, action: () => document.execCommand("justifyCenter") },
                  { icon: AlignRight, action: () => document.execCommand("justifyRight") },
                  { icon: AlignJustify, action: () => document.execCommand("justifyFull") },
                ].map((tool, i) => (
                  <Button key={i} variant="ghost" size="icon" className="h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => { editorRef.current?.focus(); tool.action(); }}>
                    <tool.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>

              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase border-t border-slate-100 dark:border-white/5">Typography</div>
              <div className="px-2 mb-1">
                <Select onValueChange={(value) => { editorRef.current?.focus(); document.execCommand("fontName", false, value); }}>
                  <SelectTrigger className="w-full h-8 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 focus:ring-0 text-xs rounded-md">
                    <SelectValue placeholder="Font Family" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }} className="text-xs">{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="px-2 mb-2">
                <Select onValueChange={(value) => {
                  editorRef.current?.focus();
                  document.execCommand("fontSize", false, "7");
                  setTimeout(() => {
                    if (editorRef.current) {
                      const fonts = editorRef.current.querySelectorAll('font[size="7"]');
                      fonts.forEach((el) => { (el as HTMLElement).removeAttribute("size"); (el as HTMLElement).style.fontSize = value; });
                      setContent(editorRef.current.innerHTML);
                      isLocalChange.current = true;
                    }
                  }, 0);
                }}>
                  <SelectTrigger className="w-full h-8 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 focus:ring-0 text-xs rounded-md">
                    <SelectValue placeholder="Font Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size.value} value={size.value} className="text-xs">{size.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase border-t border-slate-100 dark:border-white/5">Colors</div>
              <div className="flex gap-2 px-2 py-1 mb-2">
                <Button variant="outline" size="sm" className="w-full text-[11px] h-8 border-slate-200 dark:border-white/10 dark:hover:bg-white/10" onClick={() => document.getElementById("ps-text-color")?.click()}>
                  <Type className="h-3.5 w-3.5 mr-1" /> Text
                </Button>
                <Button variant="outline" size="sm" className="w-full text-[11px] h-8 border-slate-200 dark:border-white/10 dark:hover:bg-white/10" onClick={() => document.getElementById("ps-bg-color")?.click()}>
                  <Sigma className="h-3.5 w-3.5 mr-1" /> BG
                </Button>
              </div>

              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase border-t border-slate-100 dark:border-white/5">Actions</div>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-[11px] font-medium cursor-pointer mx-1 mb-1 rounded-md focus:bg-slate-100 dark:focus:bg-white/10">
                <Upload className="h-3.5 w-3.5 mr-2 opacity-70" /> Import Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} disabled={isExporting} className="text-[11px] font-medium cursor-pointer mx-1 mb-1 rounded-md focus:bg-slate-100 dark:focus:bg-white/10">
                <Download className="h-3.5 w-3.5 mr-2 opacity-70" /> {isExporting ? "Exporting..." : "Export to PDF"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input type="color" id="ps-text-color" className="hidden" onChange={(e) => { editorRef.current?.focus(); document.execCommand("foreColor", false, e.target.value); }} />
          <input type="color" id="ps-bg-color" className="hidden" onChange={(e) => { editorRef.current?.focus(); document.execCommand("hiliteColor", false, e.target.value); }} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500")} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/20 mx-1 flex-shrink-0" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* ====== MAIN EDITOR CANVAS ====== */}
      <main
        className={cn(
          "flex-1 overflow-y-auto relative scroll-smooth no-scrollbar",
          "bg-white dark:bg-black text-slate-900 dark:text-slate-100"
        )}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-indigo-500/10 backdrop-blur-sm border-2 border-dashed border-indigo-400 rounded-lg m-4 pointer-events-none">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-3 text-indigo-500 animate-bounce" />
              <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                Drop file to import
              </p>
            </div>
          </div>
        )}

        {/* ContentEditable Editor */}
        <div className="relative w-full min-h-full">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            data-placeholder="Start typing or press '/' for commands..."
            className={cn(
              "ps-editor outline-none w-full min-h-[calc(100vh-64px)] px-6 sm:px-12 md:px-20 py-8 sm:py-12",
              "selection:bg-indigo-500/20 text-slate-900 dark:text-slate-100",
              "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-slate-400 [&:empty]:before:pointer-events-none [&:empty]:before:block"
            )}
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: "1.8",
              fontSize: "16px",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          />

          {/* ====== FLOATING TOOLBAR (on text selection) ====== */}
          {showFloatingToolbar && (
            <div
              className={cn(
                "absolute z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-xl border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150",
                "bg-white/95 border-slate-200 dark:bg-black/95 dark:border-white/10"
              )}
              style={{
                top: floatingToolbarPos.top,
                left: floatingToolbarPos.left,
                transform: "translateX(-50%)",
              }}
              onMouseDown={(e) => e.preventDefault()} // prevent losing selection
            >
              {[
                {
                  icon: Bold,
                  action: () => document.execCommand("bold"),
                  title: "Bold",
                },
                {
                  icon: Italic,
                  action: () => document.execCommand("italic"),
                  title: "Italic",
                },
                {
                  icon: Underline,
                  action: () => document.execCommand("underline"),
                  title: "Underline",
                },
                {
                  icon: Strikethrough,
                  action: () => document.execCommand("strikeThrough"),
                  title: "Strikethrough",
                },
                {
                  icon: Link,
                  action: () => {
                    const url = prompt("Enter URL:");
                    if (url) document.execCommand("createLink", false, url);
                  },
                  title: "Link",
                },
                {
                  icon: Code2,
                  action: () => {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                      const range = sel.getRangeAt(0);
                      const code = document.createElement("code");
                      code.className = "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md font-mono text-[0.9em]";
                      code.style.borderRadius = "4px";
                      code.style.fontFamily =
                        "'JetBrains Mono', 'Fira Code', monospace";
                      code.style.fontSize = "0.9em";
                      range.surroundContents(code);
                    }
                  },
                  title: "Inline Code",
                },
              ].map((tool, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm"
                  title={tool.title}
                  onClick={() => {
                    tool.action();
                    setTimeout(() => {
                      if (editorRef.current) {
                        setContent(editorRef.current.innerHTML);
                        isLocalChange.current = true;
                      }
                    }, 0);
                  }}
                >
                  <tool.icon
                    className={cn("h-3.5 w-3.5", "text-slate-500 dark:text-slate-400")}
                  />
                </Button>
              ))}

              {/* Inline Font selector in floating toolbar */}
              <div
                className={cn(
                  "h-4 w-[1px] mx-0.5",
                  "bg-slate-200 dark:bg-white/20"
                )}
              />
              <Select
                onValueChange={(value) => {
                  document.execCommand("fontName", false, value);
                  setTimeout(() => {
                    if (editorRef.current) {
                      setContent(editorRef.current.innerHTML);
                      isLocalChange.current = true;
                    }
                  }, 0);
                }}
              >
                <SelectTrigger className="h-7 w-[80px] text-[10px] border-0 bg-transparent focus:ring-0 px-1.5">
                  <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem
                      key={font.value}
                      value={font.value}
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ====== SLASH COMMAND MENU ====== */}
          {showSlashMenu && (
            <div
              className={cn(
                "absolute z-50 w-72 rounded-lg shadow-2xl overflow-hidden border animate-in fade-in zoom-in-95 duration-100",
                "bg-white dark:bg-black border-slate-200 dark:border-white/10"
              )}
              style={{
                top: slashMenuPos.top,
                left: slashMenuPos.left,
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
                      onMouseDown={(e) => e.preventDefault()}
                      className={cn(
                        "w-full px-3 py-2 text-left flex items-center gap-3 transition-colors",
                        index === slashSelectedIndex
                          ? "bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400"
                          : "bg-transparent text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <div className="p-1 rounded border opacity-70">
                        <cmd.icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {cmd.label}
                          </span>
                          {cmd.shortcut && slashFilter && (
                            <span className="text-[10px] uppercase bg-indigo-500/20 px-1 rounded text-indigo-500">
                              /{cmd.shortcut}
                            </span>
                          )}
                        </div>
                        <span className="text-xs opacity-50">
                          {cmd.description}
                        </span>
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
      </main>
    </div>
  );
}

export default Editor;
