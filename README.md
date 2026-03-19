# ⚡️ PageSmith

**Collaborate. Create. Conquer.**

PageSmith is a hyper-fast, real-time collaborative workspace built for technical teams, developers, and creators. It bridges the gap between distraction-free Markdown editors, rich visual word processors, and AI-powered assistants—all wrapped in a striking, high-contrast Neo-Brutalist design.

---

## 🎯 The Purpose: What Problem Does It Solve?

Modern teams suffer from severe **context switching**. 
* You write documentation in Google Docs or Notion.
* You write code in VS Code.
* You brainstorm and debug using ChatGPT or Gemini in a separate browser tab.
* You share and convert files through various third-party tools.

**PageSmith solves this fragmentation.** It provides a single, unified "Canvas" where you can type at the speed of thought using Markdown, visually align and format text, drop in heavy PDF documents to extract text, and ask an AI assistant to generate code—all while your teammates watch your cursor move in real-time.

---

## 🚀 Why Is It Different?

Most collaborative text editors force you to choose a side:
* **WYSIWYG (Notion/Google Docs):** Great for visual layout, but clicking through menus to format code blocks breaks a developer's flow.
* **Pure Markdown (HackMD/Obsidian):** Great for speed, but terrible if you just want to center a title or change a font family.

**PageSmith is the bridge.** It gives you the speed of slash commands and Markdown, the visual controls of a rich-text editor, the collaborative power of multiplayer syncing, and the intelligence of an AI IDE—paired with an unapologetically bold UI.

---

## ✨ Key Features

### 📝 Hybrid Editor (Markdown + Rich Text)
Write in pure Markdown, but use the formatting toolbar to apply alignments (`left`, `center`, `right`, `justify`), custom font families, and highlighters. We achieve this by seamlessly parsing injected HTML alongside standard Markdown.

### ⚡️ Slash Commands
Keep your hands on the keyboard. Type `/js`, `/python`, `/table`, `/math`, or `/todo` to instantly scaffold complex structures, equations, and code blocks with full syntax highlighting.

### 🤝 Multiplayer Real-Time Sync
Built on WebSockets, changes appear instantly across all connected clients. See exactly what your team is typing, debugging, or formatting in real-time.

### 🤖 Integrated AI Assistant
A built-in, slide-out panel powered by Google Gemini. Ask the AI to write code, summarize text, or brainstorm ideas directly beside your document, then copy-paste the results instantly into your Canvas.

### 📁 Universal Drag-and-Drop Import
Drop `.txt`, `.md`, code files (`.ts`, `.py`, etc.), or even **`.pdf`** files directly into the editor. PageSmith parses PDF documents locally in the browser and injects the text directly into your workspace.

### 🖨️ Export to PDF
Instantly compile your beautiful Canvas—complete with themes, code blocks, and math equations—into a clean, printable PDF with a single click.

### 🎨 Neo-Brutalist Theming
A bold, high-contrast user interface with hard shadows, sharp corners, and carefully curated color palettes (Nord, Slate, Ocean, Light/Dark).

### 💳 SaaS Ready
Built-in dashboard management for Owned and Shared canvases, secured by Clerk Authentication, with tiered subscriptions integrated seamlessly via Razorpay.

---

## 🧠 AI Integration Methodology

PageSmith integrates a persistent AI Assistant directly into the workflow context.

* **Flow State Preservation:** Instead of switching to a different tab to consult an LLM, the assistant lives in the same window.
* **Technical Implementation:** The frontend securely communicates with a Next.js API route (`/api/gemini`), which acts as a proxy to Google's Gemini models. This ensures API keys are kept secure on the server while delivering fast, contextual responses to the client.

---

## ⚡️ Architecture & How It Works



PageSmith employs a modern, decoupled architecture designed for scale, speed, and safety:

1. **Frontend Rendering Magic:** The `Editor` component uses `react-markdown` paired with `rehype-raw` and `rehype-katex`. This is the secret sauce that allows PageSmith to render standard Markdown, LaTeX math equations, *and* HTML `<div>` tags simultaneously, enabling MS Word-style alignments inside a Markdown file.
2. **Debounced Real-Time Engine:**
   A custom `useSocket` hook manages the WebSocket connection. When a user types, the input is throttled using a `useDebounce` hook to prevent overwhelming the server. The payload is emitted via a `canvas-update` event, which the backend broadcasts to all users in that specific Canvas "Room".
3. **Client-Side File Processing:**
   File parsing happens entirely on the client side using the browser's `FileReader` API and `pdfjs-dist` web workers. This ensures zero latency and absolute privacy—your sensitive PDFs and code files are parsed locally, not uploaded to a server to be read.
4. **Secure Payment Handshake:**
   The Razorpay workflow uses a 3-step secure handshake: The frontend requests an order ID via an API route -> The user pays via the Razorpay modal -> The frontend sends the signature to the backend for cryptographic verification before upgrading the database record.

---

## 🛠 Tech Stack

* **Frontend:** React, Next.js (App Router), Tailwind CSS, Framer Motion
* **Backend & Real-time:** Node.js, Express, Socket.io
* **Database:** Prisma ORM
* **Markdown Parsing:** `react-markdown`, `remark-gfm`, `remark-math`, `rehype-raw`, `rehype-katex`, `react-syntax-highlighter`
* **AI:** Google Gemini API
* **Auth:** Clerk
* **Payments:** Razorpay
* **Icons:** Lucide React

---

## 📦 Getting Started

### Prerequisites
* Node.js (v18+)
* API Keys for: Clerk, Razorpay, and Google Gemini.

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/pagesmith.git](https://github.com/yourusername/pagesmith.git)
   cd pagesmith