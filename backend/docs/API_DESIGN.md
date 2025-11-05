## Overview

This document describes the public-facing API for the **Knowledge Grounded Chat Service**.

The API enables clients to:

* Query the RAG pipeline (streaming and non-streaming)
* Perform health checks
* Observe server-sent events (SSE)
* Debug LLM retrieval behavior

All endpoints are served from:
`/api/chat`

---

## 🔌 Base URL

| Environment | Example                            |
| ----------- | ---------------------------------- |
| Local       | `http://localhost:3000/api/chat`   |
| Production  | `https://your-domain.com/api/chat` |

---

## 🧩 Endpoints Summary

| Method | Route              | Description                                | Streaming |
| ------ | ------------------ | ------------------------------------------ | --------- | 
| `POST` | `/api/chat/stream` | Primary chat endpoint (Server-Sent Events) | ✅ Yes    | 
| `POST` | `/api/chat/test`   | Non-streaming test endpoint (debug)        | ❌ No     |
| `GET`  | `/api/chat/health` | Health & vector store statistics           | ❌ No     | 

---

## POST `/api/chat/stream`

### Description

Starts a **streaming chat session** using **Server-Sent Events (SSE)**.
It processes the user’s query via the RAG pipeline and streams incremental tokens, citations, and events in real time.

### Request Body — `ChatQueryDto`

| Field                 | Type               | Required | Description                                                  |
| --------------------- | ------------------ | -------- | ------------------------------------------------------------ |
| `query`               | `string`           | ✅        | The user’s question or message                               |
| `useGeneralLLM`       | `boolean`          | ✅        | Whether to use the general LLM (hybrid mode) or KB-only mode |

#### `ChatMessageDto` structure

| Field     | Type     | Example                        |          |
| --------- | -------- | ------------------------------ | -------- |
| `role`    | `'user'  | 'assistant'`                   | `"user"` |
| `content` | `string` | `"What is the refund policy?"` |          |

### Example Request

```bash
POST /api/chat/stream
Content-Type: application/json
Accept: text/event-stream

{
  "query": "What is the Pro plan price?",
  "useGeneralLLM": false,
}
```

### SSE Event Stream

The response is a continuous stream of `text/event-stream` data.

| Event Type | Description                                               | Example Payload                                |
| ---------- | --------------------------------------------------------- | ---------------------------------------------- |
| `token`    | Partial response tokens emitted as the LLM generates text | `"The Pro plan costs"`                         |
| `citation` | JSON string of retrieved document source(s)               | `{"source":"Internal Docs","confidence":0.78}` |
| `end`      | Indicates the end of the stream                           | `"END_OF_STREAM"`                              |
| `error`    | Error message if the pipeline fails                       | `"An error occurred..."`                       |

### Example Response Stream

```http
event: token
data: The Pro plan costs

event: token
data: $20 per month.

event: citation
data: {"source":"Pricing Docs","confidence":0.92}

event: end
data: END_OF_STREAM
```

### Response Headers

| Header          | Value               |
| --------------- | ------------------- |
| `Content-Type`  | `text/event-stream` |
| `Cache-Control` | `no-cache`          |
| `Connection`    | `keep-alive`        |

---

## POST `/api/chat/test`

### Description

Non-streaming version of the chat pipeline.
Waits for all SSE events to complete, aggregates the tokens, and returns a single JSON response — ideal for debugging.

### Request Body — `ChatQueryDto`

Same as `/stream`.

### Response Body — `ChatTestResponseDto`

| Field      | Type             | Description                                    |
| ---------- | ---------------- | ---------------------------------------------- |
| `message`  | `string`         | Aggregated message from all `token` events     |
| `citation` | `object \| null` | Parsed citation JSON from the `citation` event |
| `events`   | `number`         | Total number of SSE events processed           |

### Example Response

```json
{
  "message": "The Pro plan costs $20 per month.",
  "citation": {
    "source": "Pricing Docs",
    "confidence": 0.92
  },
  "events": 42
}
```

### Example Usage

```bash
curl -X POST http://localhost:3000/api/chat/test \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain Pro plan pricing", "useGeneralLLM": true}'
```

---

## GET `/api/chat/health`

### Description

Checks API readiness and retrieves vector store statistics.

### Example Response

```json
{
  "status": "ok",
  "timestamp": "2025-11-05T10:22:01.381Z",
  "stats": {
    "documents": 4,
    "chunks": 482,
    "lastIndexed": "2025-11-04T22:18:42Z"
  }
}
```

---

## ⚙️ Internal Types

### `SSEEvent`

```ts
export interface SSEEvent {
  event: 'token' | 'citation' | 'end' | 'error';
  data: string;
}
```

### `RetrievalResult`

Used internally in `VectorStoreService` search results:

```ts
export interface RetrievalResult {
  content: string;
  score: number; // cosine similarity or relevance score
  metadata?: Record<string, unknown>;
}
```

---

## Architecture Linkage

| Layer            | Component                             | Description                                     |
| ---------------- | ------------------------------------- | ----------------------------------------------- |
| **Controller**   | `ChatController`                      | Handles API routes (`stream`, `test`, `health`) |
| **Service**      | `ChatService`                         | Orchestrates retrieval + response generation    |
| **Strategy**     | `StrictKBStrategy` / `HybridStrategy` | Controls LLM response logic                     |
| **Vector Store** | `VectorStoreService`                  | Performs similarity search in pgvector          |
| **Types**        | `SSEEvent`, `RetrievalResult`         | Define streaming message structure              |

---

## Error Handling

| Scenario                        | Event Type | Message                                             |
| ------------------------------- | ---------- | --------------------------------------------------- |
| Vector store connection failure | `error`    | `"Failed to retrieve context from knowledge base."` |
| LLM timeout                     | `error`    | `"LLM did not respond in time."`                    |
| Unexpected exception            | `error`    | `"An error occurred while processing your query."`  |

---

## Response Modes

| Mode          | Flag (`useGeneralLLM`) | Description                                     |
| ------------- | ---------------------- | ----------------------------------------------- |
| **Strict KB** | `false`                | Only uses internal documents (retrieval-based)  |
| **Hybrid**    | `true`                 | Uses both internal KB and general LLM reasoning |

---

## Summary

| Category           | Description                                  |
| ------------------ | -------------------------------------------- |
| **Framework**      | NestJS with RxJS Observables                 |
| **Transport**      | Server-Sent Events (SSE)                     |
| **DTO Validation** | `class-validator` + `@nestjs/swagger`        |
| **Primary Flow**   | `/stream` endpoint with live token streaming |
| **Debug Flow**     | `/test` aggregates full response             |
| **Monitoring**     | `/health` exposes vector store status        |

