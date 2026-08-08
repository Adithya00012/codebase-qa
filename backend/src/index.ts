import cors from "cors";
import express from "express";
import { cloneRepo } from "./cloneRepo";
import { prisma } from "./prismaClient";
import { parseFiles } from "./parseFiles";

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

app.get("/repos/:id/files", async (req, res) => {
  const repo = await prisma.repo.findUnique({ where: { id: req.params.id } });
  if (!repo) return res.status(404).json({ error: "repo not found" });

  try {
    const files = await parseFiles(`./cloned_repos/${repo.name}`);
    res.json({ files: files.map((f) => f.filePath) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});