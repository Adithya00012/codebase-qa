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

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 4000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/repos", async (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  try {
    await cloneRepo(url, name);
    const repo = await prisma.repo.create({
      data: { name, url },
    });
    res.json(repo);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/repos/:id/ingest", async (req, res) => {
  const repo = await prisma.repo.findUnique({ where: { id: req.params.id } });
  if (!repo) return res.status(404).json({ error: "repo not found" });

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

app.get("/repos/:id/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "missing ?q= param" });

  try {
    const results = await searchChunks(req.params.id, query);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/repos/:id/ask", async (req, res) => {
  const question = req.query.q as string;
  if (!question) return res.status(400).json({ error: "missing ?q= param" });

  try {
    const chunks = await searchChunks(req.params.id, question);
    const answer = await generateAnswer(question, chunks);
    res.json({ answer, sources: chunks.map((c) => c.filePath) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});