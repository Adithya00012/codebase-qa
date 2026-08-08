# Codebase Q&A — AI-Powered RAG Assistant

Ask natural language questions about any public GitHub repository and get accurate, cited answers grounded in the actual source code.

## How it works

1. **Ingest** — Clone a GitHub repo, parse source files (`.js`, `.ts`, `.py`, etc).
2. **Chunk** — Split code into meaningful pieces using LangChain's language-aware text splitter (respects function/class boundaries).
3. **Embed** — Generate vector embeddings locally using `transformers.js` (MiniLM, 384-dim) — no API cost.
4. **Store** — Save chunks + embeddings in PostgreSQL with the `pgvector` extension.
5. **Retrieve** — On a question, embed the query and run cosine similarity search to find the most relevant chunks.
6. **Generate** — Feed retrieved chunks + question to an LLM (Groq, Llama 3.3 70B) to produce a cited answer.
7. **Cache** — Repeated questions on the same repo are served instantly from Redis.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL + pgvector, Prisma ORM
- **Cache:** Redis
- **AI:** LangChain (chunking), transformers.js (local embeddings), Groq API (LLM answering)
- **Testing:** Jest

## Project Structure
codebase-qa/
├── backend/ Express API, ingestion pipeline, RAG logic
└── frontend/ React chat interface

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL with pgvector extension
- Redis
- A free Groq API key (https://console.groq.com)

### Backend
```bash
cd backend
npm install
# create .env with DATABASE_URL and GROQ_API_KEY
npx prisma generate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL, submit a public GitHub repo URL, wait for ingestion, then ask questions about the codebase.

## Testing

```bash
cd backend
npm test
```

## Roadmap / Future Work

- Authentication + multi-repo support per user
- Streaming LLM responses
- Docker deployment
- MCP (Model Context Protocol) integration — expose repo Q&A as a tool for other AI agents

## License

MIT