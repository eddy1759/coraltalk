# CoralTalk Chatbot Assesment

A **Retrieval-Augmented Generation (RAG)** chatbot system that combines your **internal knowledge base** with **OpenAI LLMs** — built for **scalable, production-ready deployments**.

This bot delivers **real-time chat streaming**, **hybrid retrieval**, and **semantic understanding** using **pgvector**, **LangChain**, and **NestJS**, with a modern **React + Tailwind + shadcn/ui** frontend.

---

## Table of Contents

- [CoralTalk Chatbot Assesment](#coraltalk-chatbot-assesment)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Architecture](#architecture)
    - [Flow Summary](#flow-summary)
  - [Project Structure](#project-structure)
  - [Setup Instructions](#setup-instructions)
    - [**1. Clone the repository**](#1-clone-the-repository)
    - [**2. Backend Setup**](#2-backend-setup)
    - [**3. Frontend Setup**](#3-frontend-setup)
  - [Key Features](#key-features)
  - [Documentation](#documentation)
  - [Deployment](#deployment)
    - [Example:](#example)

---

##  Overview

This bot is a **modular chatbot platform** designed for organizations that want intelligent, grounded AI assistants powered by their own data.

It consists of:

* **RAG backend (NestJS + Prisma + pgvector)** — Handles retrieval, embeddings, and LLM orchestration.
* 💬 **Frontend client (React + Vite + Tailwind + shadcn)** — Provides a beautiful chat interface with streaming token updates.

This bot can ingest documents (PDFs, text, FAQs) and use them to generate **context-aware**, **cited** responses.

---

## Architecture

```
                         ┌────────────────────────────┐
                         │        Frontend (Vite)     │
                         │  React + Tailwind + shadcn │
                         │  /api/chat → SSE Stream    │
                         └──────────────┬─────────────┘
                                        │
                                        ▼
                       ┌────────────────────────────────┐
                       │       Backend (NestJS)         │
                       │   RAG Pipeline w/ LangChain    │
                       │  - StrictKBStrategy            │
                       │  - HybridStrategy              │
                       └──────────────┬────────────────┘
                                      │
                                      ▼
                       ┌────────────────────────────────┐
                       │     PostgreSQL + pgvector       │
                       │  Stores embeddings + metadata   │
                       └────────────────────────────────┘
```

### Flow Summary

1. User asks a question on the web UI.
2. Backend retrieves relevant text chunks using **pgvector**.
3. Selected **strategy** (strict or hybrid) combines internal data and LLM reasoning.
4. Response is **streamed** token-by-token to the UI via **SSE**.
5. Citations are sent along for transparency.

---

## Project Structure

```
coraltalk/
├── backend/              # NestJS + Prisma + LangChain + pgvector
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── README.md
│
├── frontend/             # React + Vite + Tailwind + shadcn UI
│   ├── src/
│   ├── package.json
│   └── README.md
│
└── README.md    
```

---

## Setup Instructions

### **1. Clone the repository**

```bash
git clone https://github.com/eddy1759/coraltalk.git
cd coraltalk
```

---

### **2. Backend Setup**

Follow instructions in the [Backend README](./backend/README.md)

Backend includes:

* Database setup (local or Neon/Supabase)
* Prisma migrations
* Document ingestion pipeline
* Chat API (`/api/chat/stream`, `/api/chat/test`, `/api/chat/health`)

---

### **3. Frontend Setup**

Follow instructions in the [Frontend README](./frontend/README.md)

Frontend includes:

* Vite dev server
* Chat UI and streaming support
* Environment config via `.env`
* React Query-based API handling

---

## Key Features

| Category                           | Features                                                            |
| ---------------------------------- | ------------------------------------------------------------------- |
| **Retrieval-Augmented Generation** | Hybrid & strict retrieval strategies with pgvector                  |
| **Streaming Chat**                 | Real-time Server-Sent Events (SSE) token streaming                  |
| **Citations**                      | Source and confidence metadata for transparency                     |
| **LangChain Integration**          | LLM orchestration and prompt templates                              |
| **Modern UI**                      | TailwindCSS + shadcn for clean and responsive design                |
| **Extensible**                     | Modular architecture — easily swap models, stores, or UI components |

---

## Documentation

| Doc                                                 | Description                                                |
| --------------------------------------------------- | ---------------------------------------------------------- |
| [Backend README](./backend/README.md)            | Setup, API, and environment details for the NestJS service |
| [Frontend README](./frontend/README.md)          | UI architecture and environment setup                      |
| [API_DESIGN.md](./docs/API_DESIGN.md)            | Endpoint specs, DTOs, and event types                      |
| [DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) | PostgreSQL schema and vector setup                         |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md)       | System-level architecture and flow                         |

---

## Deployment

CoralTalk can be deployed as a **two-tier system**:

* **Frontend:** Static hosting (Vercel)
* **Backend:** Node service (Render)
* **Database:** PostgreSQL with `pgvector` (Neon)

### Example:

```bash
# Build frontend
cd frontend && pnpm build

# Start backend (prod)
cd ../backend && pnpm start:prod
```

Ensure your production `.env` files point to the correct URLs.

---

