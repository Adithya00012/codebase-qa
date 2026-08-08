import cors from "cors";
import express from "express";
import { cloneRepo } from "./cloneRepo";
import { prisma } from "./prismaClient";
import { parseFiles } from "./parseFiles";
import { chunkFile } from "./chunkFile";
import { embedText } from "./embedText";
import { saveEmbedding } from "./saveEmbedding";
import { searchChunks } from "./searchChunks";
import { generateAnswer } from "./generateAnswer";
import { getRedisClient } from "./redisClient";
import { signup, login } from "./auth";
import { requireAuth, AuthRequest } from "./authMiddleware";

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 4000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  try {
    const result = await signup(email, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  try {
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: String(err) });
  }
});

app.post("/repos", requireAuth, async (req: AuthRequest, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  try {
    await cloneRepo(url, name);
    const repo = await prisma.repo.create({
      data: { name, url, userId: req.userId! },
    });
    res.json(repo);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/repos/:id/ingest", requireAuth, async (req: AuthRequest, res) => {
  const repo = await prisma.repo.findUnique({ where: { id: (req.params.id as string) } });
  if (!repo || repo.userId !== req.userId) {
    return res.status(404).json({ error: "repo not found" });
  }

  try {
    const files = await parseFiles(`./cloned_repos/${repo.name}`);
    let totalChunks = 0;

    for (const file of files) {
      const ext = file.filePath.split(".").pop();
      const language = ext === "py" ? "python" : "js";
      const chunks = await chunkFile(file.content, language);

      for (const chunk of chunks) {
        const created = await prisma.chunk.create({
          data: { repoId: repo.id, filePath: file.filePath, content: chunk },
        });
        const vector = await embedText(chunk);
        await saveEmbedding(created.id, vector);
        totalChunks++;
      }
    }

    res.json({ filesProcessed: files.length, chunksCreated: totalChunks });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/repos/:id/search", requireAuth, async (req: AuthRequest, res) => {
  const repo = await prisma.repo.findUnique({ where: { id: (req.params.id as string) } });
  if (!repo || repo.userId !== req.userId) {
    return res.status(404).json({ error: "repo not found" });
  }

  const query = req.query.q as unknown as string;
  if (!query) return res.status(400).json({ error: "missing ?q= param" });

  try {
    const results = await searchChunks((req.params.id as string), query);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/repos/:id/ask", requireAuth, async (req: AuthRequest, res) => {
  const repo = await prisma.repo.findUnique({ where: { id: (req.params.id as string) } });
  if (!repo || repo.userId !== req.userId) {
    return res.status(404).json({ error: "repo not found" });
  }

  const question = req.query.q as unknown as string;
  if (!question) return res.status(400).json({ error: "missing ?q= param" });

  const cacheKey = `ask:${(req.params.id as string)}:${question}`;

  try {
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ ...JSON.parse(cached), cached: true });
    }

    const chunks = await searchChunks((req.params.id as string), question);
    const answer = await generateAnswer(question, chunks);
    const result = { answer, sources: chunks.map((c) => c.filePath) };

    await redis.set(cacheKey, JSON.stringify(result), { EX: 3600 });

    res.json({ ...result, cached: false });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
