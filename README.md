
---

# 🖋️ PageSmith

**Your all-in-one collaborative canvas for writing, thinking, and creating.**

PageSmith is a full-stack canvas application inspired by [Notion](https://www.notion.so), designed for those who prefer typing over handwriting. Whether you're writing solo or collaborating in real-time, PageSmith lets you build structured documents, personal wikis, or team workspaces — beautifully and intuitively.

> 💡 *"I never liked handwritten notes — so I built a tool that lets me write and structure my thoughts the way I want, and share it with my peers. PageSmith is for people like me."*
> — *Creator of PageSmith*

---

## 🚧 Project Status

**UNDER CONSTRUCTION** — This project is in active development and aims to:

* Replicate and extend **Notion’s core functionalities**
* Provide **real-time collaborative editing**
* Deliver a **faster**, **cheaper**, and **more user-friendly** experience

---

## 🔮 Vision

PageSmith is being built with the long-term goal of becoming:

* 🧠 A second-brain system for notes, research, and ideation
* 👥 A collaboration tool for teams, students, and creators
* 💸 A cost-effective alternative to Notion with transparent pricing
* 🎨 Aesthetic, distraction-free writing space with intuitive UX

---

## 🏗️ Architecture Overview

Built using a **TurboRepo** monorepo setup for performance, modularity, and scalability.

```
/apps
  /web       → Frontend (Next.js + TailwindCSS)
  /api       → Backend (Node.js, tRPC or REST)
  /ws        → WebSocket server for real-time sync

/packages
  /ui        → Shared component library (shadcn/ui, Tailwind)
  /utils     → Shared utility functions
  /db        → Prisma schema and client
```

---

## 🧠 Core Tech Stack

| Layer          | Tools & Frameworks                                      |
| -------------- | ------------------------------------------------------- |
| Frontend       | **Next.js**, **TailwindCSS**, **React Query**           |
| Backend        | **Node.js**, **Express/tRPC**, **Prisma**               |
| Database       | **PostgreSQL**                                          |
| Realtime       | **WebSockets** (Socket.IO or tRPC subscriptions)        |
| Authentication | **NextAuth.js** / **JWT**                               |
| Dev Workflow   | **TurboRepo**, **pnpm**, **Docker**, **GitHub Actions** |

---

## ✨ Features Roadmap

| Feature                       | Status    |
| ----------------------------- | --------- |
| Canvas-based writing space    | ✅ MVP     |
| Block-based content model     | ✅ MVP     |
| Real-time collaboration       | 🚧 In Dev |
| Peer sharing & access control | 🚧 In Dev |
| Markdown + Rich Text support  | ✅ Planned |
| Nested pages & sidebar nav    | ✅ Planned |
| Drag-and-drop blocks/pages    | ✅ Planned |
| AI writing assistant          | 🔜 Future |
| Version history & rollback    | 🔜 Future |

---

## 📸 Preview

> *(Screenshots or demo gifs go here once available — for now, you can drop a placeholder like below)*

```
[📷 Canvas editing in action — Coming Soon]
```

---

## 🤝 Contributions

PageSmith is a personal vision with open arms — if you resonate with the problem, ideas, or direction:

* 🛠 Feel free to fork and explore
* 🧠 Open issues or discussions with ideas
* 🚀 PRs welcome when ready

---

## 📄 License

MIT License © 2025 [Papun Mohapatra](https://github.com/Papun1111)

---

## 🙏 Inspiration

* **Notion** — The gold standard in digital workspaces
* **Craft Docs**, **Obsidian**, and **HackMD** — For user experience and community-driven innovation
* The frustration of scattered notes, unstructured writing tools, and expensive subscriptions

---

