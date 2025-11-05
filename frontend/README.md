# CoralTalk Chatbot — Frontend

Modern **React + Vite** web client for the **CoralTalk Chatbot** system.
Built with **TailwindCSS**, **shadcn/ui**, and **Radix UI**, this frontend connects to the **NestJS RAG backend** to deliver a seamless, real-time chat experience powered by **OpenAI** and **LangChain**.

---

## Table of Contents

- [CoralTalk Chatbot — Frontend](#coraltalk-chatbot--frontend)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
    - [**1. Prerequisites**](#1-prerequisites)
    - [**2. Install Dependencies**](#2-install-dependencies)
    - [**3. Run the Development Server**](#3-run-the-development-server)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Environment Setup](#environment-setup)
  - [Chat Flow Overview](#chat-flow-overview)
  - [Styling \& Components](#styling--components)
    - [**TailwindCSS**](#tailwindcss)
    - [**shadcn/ui**](#shadcnui)
    - [**Icons**](#icons)
  - [🔧 Development Commands](#-development-commands)
  - [API Integration](#api-integration)
  - [Deployment](#deployment)
    - [**Build for Production**](#build-for-production)
    - [**Preview Build**](#preview-build)
    - [**Deploy to**](#deploy-to)

---

## Quick Start

### **1. Prerequisites**

* **Node.js** ≥ 20
* **pnpm** ≥ 9
* CoralTalk Backend running locally (see [Backend Setup](../backend/README.md))

---

### **2. Install Dependencies**

```bash
pnpm install
```

---

### **3. Run the Development Server**

```bash
pnpm dev
```

Visit the app at:

`http://localhost:3000`

---

## Tech Stack

| Layer           | Technology                  |
| --------------- | --------------------------- |
| Framework       | React 19 (with Vite 7)      |
| Styling         | TailwindCSS + shadcn/ui     |
| Animation       | tailwind-animate            |
| Routing         | React Router v7             |
| State/Data      | React Query v5              |
| Icons           | lucide-react                |
| Theme           | next-themes (dark/light)    |
| Markdown Render | react-markdown + remark-gfm |

---

## Project Structure

```
src/
├── components/        # UI components (shadcn + custom)
│   ├── chat/          # Chat UI (messages, input, streaming)
│   └── ui/            # Reusable shadcn-based primitives
├── hooks/             # Custom React hooks
├── lib/               # Utility helpers (API, constants)
├── pages/             # Route pages (Chat, NotFound, etc.)
├── App.tsx            # Root component
└── main.tsx           # App entry point
```

---

## Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Example contents:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Chat Flow Overview

1. **User** types a query into the chat input.
2. **Frontend** sends the request to:

   * `/api/chat/stream` → for real-time token streaming, or
   * `/api/chat/test` → for debug mode (non-streaming)
3. The **Server-Sent Events (SSE)** stream sends incremental messages:

   * `token` → model output tokens
   * `citation` → reference metadata
   * `end` → stream completion
   * `error` → error handling
4. The UI progressively renders the model output for a smooth experience.

---

## Styling & Components

### **TailwindCSS**

Fully configured with `tailwind-merge` and `tailwind-animate` for smooth animations.

### **shadcn/ui**

All UI primitives (buttons, inputs, cards, etc.) are sourced from [shadcn/ui](https://ui.shadcn.com).

### **Icons**

`lucide-react` for consistent vector icons.

---

## 🔧 Development Commands

| Command        | Description                               |
| -------------- | ----------------------------------------- |
| `pnpm dev`     | Start development server                  |
| `pnpm build`   | Build for production                      |
| `pnpm preview` | Preview built app                         |
| `pnpm lint`    | Run ESLint checks                         |
| `pnpm format`  | Format code (if configured with Prettier) |

---

## API Integration

The frontend communicates with the backend via environment-based configuration:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
```

Endpoints used:

| Endpoint       | Method | Description                  |
| -------------- | ------ | ---------------------------- |
| `/chat/stream` | `POST` | Stream chat replies via SSE  |
| `/chat/test`   | `POST` | Non-streaming debug endpoint |
| `/chat/health` | `GET`  | Health/status check          |

All requests and responses follow the [API_DESIGN.md](../docs/API_DESIGN.md).

---

## Deployment

### **Build for Production**

```bash
pnpm build
```

### **Preview Build**

```bash
pnpm preview
```

### **Deploy to**

* **Vercel** (recommended)
* **Netlify**
* **Cloudflare Pages**
* or any static host supporting Vite builds.

---

✅ **Next Steps**

* Run the backend (`pnpm run start:dev`)
* Start the frontend (`pnpm dev`)
* Open **[http://localhost:3000](http://localhost:3000)** and start chatting with CoralTalk