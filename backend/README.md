# CoralTalk Chatbot — Backend

Backend API for the **CoralTalk Chatbot** system built with **NestJS**, **PostgreSQL + pgvector**, and **LangChain**.
This service powers the chatbot’s **retrieval-augmented generation (RAG)** capabilities, supporting both **streaming** and **non-streaming** chat responses.

---

## 📚 Table of Contents

- [CoralTalk Chatbot — Backend](#coraltalk-chatbot--backend)
  - [📚 Table of Contents](#-table-of-contents)
  - [Quick Start](#quick-start)
    - [**Prerequisites**](#prerequisites)
    - [🧩 Tech Stack](#-tech-stack)
    - [**2. Install Dependencies**](#2-install-dependencies)
    - [**3. Configure Environment**](#3-configure-environment)
      - [1. Database Setup](#1-database-setup)
        - [Option 1: Local Database](#option-1-local-database)
        - [Option 2: External Database (Recommended)](#option-2-external-database-recommended)
    - [**4. Database Schema Setup**](#4-database-schema-setup)
    - [**5. Ingest Documents**](#5-ingest-documents)
    - [**6. Start Development Server**](#6-start-development-server)
  - [API Endpoints](#api-endpoints)
    - [**Stream Chat (SSE)**](#stream-chat-sse)
    - [**Test Chat (Non-Streaming)**](#test-chat-non-streaming)
    - [**Health Check**](#health-check)
  - [Project Structure](#project-structure)
  - [Database Schema](#database-schema)
  - [Core Concepts](#core-concepts)
  - [Development Commands](#development-commands)
  - [Environment Variables](#environment-variables)
  - [📘 Resources](#-resources)
  - [✅ Next Steps](#-next-steps)

---

## Quick Start

### **Prerequisites**

* **Node.js** ≥ 20
* **pnpm** ≥ 9
* **PostgreSQL** ≥ 16 with `pgvector` extension
* **OpenAI API Key**

---

### 🧩 Tech Stack

| Layer           | Technology             |
| --------------- | ---------------------- |
| Framework       | NestJS                 |
| ORM             | Prisma                 |
| Database        | PostgreSQL + pgvector  |
| LLM             | OpenAI (via LangChain) |
| Vector Store    | Native pgvector        |
| API             | REST + SSE             |
| Package Manager | pnpm                   |

---

### **2. Install Dependencies**

```bash
pnpm install
```

---

### **3. Configure Environment**

#### 1. Database Setup

You can use either a **local PostgreSQL instance** or a **managed one** such as
[Neon](https://neon.tech), [Supabase](https://supabase.com), or [Aiven](https://aiven.io/postgresql).

##### Option 1: Local Database

```bash
createdb knowledge_chatbot
```

Enable the `pgvector` extension:

```bash
psql -d knowledge_chatbot -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

##### Option 2: External Database (Recommended)

If using **Neon**, **Supabase**, or other external PostgreSQL services:

1. Create a new project.
2. Copy the **connection string**, typically:

```bash
postgresql://user:password@host:port/database?sslmode=require
```

3. Copy the example environment file:

```bash
cp .env.example .env
```

4. Edit `.env` with your values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_chatbot?schema=public"
OPENAI_API_KEY="sk-your-key"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
PORT=3001
```

See full variable list below: [Environment Variables](#-environment-variables)

---

### **4. Database Schema Setup**

Generate Prisma client and apply migrations:

```bash
pnpm run prisma:generate
pnpm run prisma:migrate
```

(Optional) Seed demo data:

```bash
pnpm run db:seed
```

---

### **5. Ingest Documents**

This loads and embeds text documents into your vector store.

```bash
pnpm run ingest
```

**Expected Output:**

```
✓ Loaded 1 document(s)
✓ Split into 45 chunks
✓ Generated 45 embeddings
✓ Successfully added 45 chunks
✅ Ingestion completed successfully
   Total documents: 1
   Total chunks: 45
   Chunks with embeddings: 45
```

---

### **6. Start Development Server**

```bash
pnpm run start:dev
```

Visit:
[http://localhost:3001](http://localhost:3001)

---

## API Endpoints

### **Stream Chat (SSE)**

**POST** `/api/chat/stream`

**Request:**

```json
{
  "query": "What is your refund policy?",
  "useGeneralLLM": false
}
```

**Response:**
Server-Sent Events stream with the following event types:

| Event      | Description                           |
| ---------- | ------------------------------------- |
| `token`    | Partial response token from the model |
| `citation` | Reference document + confidence score |
| `end`      | Stream completion signal              |
| `error`    | Error message                         |

---

### **Test Chat (Non-Streaming)**

**POST** `/api/chat/test`
Returns a single JSON response (aggregated) — useful for debugging RAG output.

---

### **Health Check**

**GET** `/api/chat/health`
Returns system status, uptime, and dependency checks.

---

## Project Structure

```
src/
├── chat/               # Chat orchestration & strategies
│   ├── dto/
│   ├── strategies/
│   ├── chat.controller.ts
│   ├── chat.module.ts
│   └── chat.service.ts
├── common/             # Shared config, filters, and types
├── ingestion/          # Document ingestion logic
├── llm/                # OpenAI + LangChain integrations
├── prisma/             # Prisma client and DB service
├── retrieval/          # Vector store & embedding logic
├── scripts/            # CLI ingestion tools
├── app.module.ts
└── main.ts
```

---

## Database Schema

| Table             | Description                              |
| ----------------- | ---------------------------------------- |
| `documents`       | Stores uploaded or reference documents   |
| `document_chunks` | Individual text chunks + embeddings      |
| `chat_history`    | Optional log of user queries & responses |

See: [DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)

---

## Core Concepts

* **Hybrid Retrieval:** Combines vector + semantic matching for better recall.
* **pgvector:** Embeddings stored natively in PostgreSQL.
* **LangChainJS:** Handles embeddings, document loaders, and text splitting.
* **Streaming SSE:** Real-time token streaming for conversational UX.
* **RAG Architecture:** Separates retrieval, reasoning, and orchestration layers.
* **Extensible Strategies:** `StrictKBStrategy` (factual answers) & `HybridStrategy` (LLM-assisted).

---

## Development Commands

| Command                   | Description                   |
| ------------------------- | ----------------------------- |
| `pnpm run start:dev`      | Start dev server (hot reload) |
| `pnpm run build`          | Compile TypeScript to JS      |
| `pnpm run start:prod`     | Run production build          |
| `pnpm run ingest`         | Ingest and embed documents    |
| `pnpm run prisma:migrate` | Apply Prisma DB migrations    |
| `pnpm run prisma:studio`  | Launch Prisma Studio GUI      |
| `pnpm run lint:format`    | Lint and format code          |

---

## Environment Variables

| Variable                         | Description                  | Example                               |
| -------------------------------- | ---------------------------- | ------------------------------------- |
| `NODE_ENV`                       | Environment mode             | `development`                         |
| `PORT`                           | Server port                  | `3001`                                |
| `DATABASE_URL`                   | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY`                 | OpenAI API key               | `sk-xxxx`                             |
| `OPENAI_MODEL`                   | Model for responses          | `gpt-4o-mini`                         |
| `OPENAI_EMBEDDING_MODEL`         | Embedding model              | `text-embedding-3-small`              |
| `LLM_TEMPERATURE`                | Model creativity level       | `0.5`                                 |
| `LLM_MAX_TOKENS`                 | Max tokens per response      | `500`                                 |
| `STREAMING_ENABLED`              | Enable SSE streaming         | `true`                                |
| `RETRIEVAL_TOP_K`                | Top-k retrieved chunks       | `5`                                   |
| `CONFIDENCE_THRESHOLD_HIGH`      | High-confidence cutoff       | `0.70`                                |
| `CONFIDENCE_THRESHOLD_LOW`       | Low-confidence cutoff        | `0.40`                                |
| `STRICT_KB_CONFIDENCE_THRESHOLD` | Strict strategy cutoff       | `0.45`                                |
| `VECTOR_DIMENSIONS`              | Embedding vector size        | `1536`                                |
| `SIMILARITY_METRIC`              | Vector similarity function   | `cosine`                              |
| `CORS_ORIGIN`                    | Allowed frontend origin      | `http://localhost:3000`               |

---

## 📘 Resources

* [ARCHITECTURAL DESIGN](./docs/ARCHITECTURE.md)
* [DATABASE DESIGN](./docs/DATABASE_DESIGN.md)
* [API DESIGN](./docs/API_DESIGN.md)


---

## ✅ Next Steps

1. Run document ingestion:

   ```bash
   pnpm run ingest
   ```
2. Start chatting:

   ```
   http://localhost:3001/api/chat/stream
   ```
3. Connect your frontend app:

   ```
   http://localhost:3000
   ```
